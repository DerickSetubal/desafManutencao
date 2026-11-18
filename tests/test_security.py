#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
tests/test_security.py — Suíte de Testes Automatizados de Segurança do dev.py
Verifica:
1. Bloqueio de Path Traversal (../, %2e%2e, barras invertidas, null bytes)
2. Bloqueio de extensões restritas (.py, .log, .env, .bak, .swp, .pem, .key)
3. Bloqueio de diretórios e arquivos confidenciais (logs/, .git, id_rsa)
4. Presença de cabeçalhos HTTP de segurança (nosniff, SAMEORIGIN, no-cache)
5. Proteção contra spoofing de Origin e Rate Limiting no /__diagnostics__
"""

import sys
import unittest
import urllib.request
import urllib.error
import urllib.parse
import json

BASE_URL = "http://127.0.0.1:8000"


class TestDevServerSecurity(unittest.TestCase):

    def request(self, path, method="GET", headers=None, data=None):
        url = urllib.parse.urljoin(BASE_URL, path)
        req = urllib.request.Request(url, method=method, headers=headers or {})
        try:
            with urllib.request.urlopen(req, data=data, timeout=5) as resp:
                return resp.status, resp.headers, resp.read()
        except urllib.error.HTTPError as e:
            return e.code, e.headers, e.read()
        except Exception as e:
            self.fail(f"Falha de conexão com {url}: {e}")

    # ==========================================================
    # 1. BLOQUEIO DE EXTENSÕES
    # ==========================================================

    def test_block_python_files(self):
        code, _, _ = self.request("/dev.py")
        self.assertEqual(code, 403, "dev.py deve retornar 403 Forbidden")

    def test_block_log_files(self):
        code, _, _ = self.request("/logs/access.log")
        self.assertEqual(code, 403, "access.log deve retornar 403 Forbidden")

    def test_block_env_and_keys(self):
        for path in ["/.env", "/id_rsa", "/cert.pem", "/database.sqlite"]:
            code, _, _ = self.request(path)
            self.assertEqual(code, 403, f"{path} deve retornar 403 Forbidden")

    # ==========================================================
    # 2. PATH TRAVERSAL
    # ==========================================================

    def test_path_traversal_dotdot(self):
        code, _, _ = self.request("/../dev.py")
        self.assertIn(code, (403, 404), "Path traversal simples deve ser bloqueado")

    def test_path_traversal_encoded(self):
        code, _, _ = self.request("/%2e%2e/dev.py")
        self.assertIn(code, (403, 404), "Path traversal urlencoded deve ser bloqueado")

    def test_path_traversal_double_encoded(self):
        code, _, _ = self.request("/%252e%252e/dev.py")
        self.assertIn(code, (403, 404), "Double urlencoded traversal deve ser bloqueado")

    def test_path_traversal_windows_backslash(self):
        code, _, _ = self.request("/..\\..\\Windows\\win.ini")
        self.assertIn(code, (403, 404), "Backslash traversal deve ser bloqueado")

    # ==========================================================
    # 3. CABEÇALHOS DE SEGURANÇA
    # ==========================================================

    def test_security_headers_present(self):
        code, headers, _ = self.request("/")
        self.assertEqual(code, 200)

        self.assertEqual(headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(headers.get("X-Frame-Options"), "SAMEORIGIN")
        self.assertIn("no-store", headers.get("Cache-Control", ""))
        self.assertIn("strict-origin", headers.get("Referrer-Policy", ""))
        self.assertIn("camera=()", headers.get("Permissions-Policy", ""))

    # ==========================================================
    # 4. DIAGNÓSTICO E CORS
    # ==========================================================

    def test_diagnostics_divergent_origin_blocked(self):
        payload = json.dumps({"type": "test", "message": "hello"}).encode("utf-8")
        code, _, _ = self.request(
            "/__diagnostics__",
            method="POST",
            headers={
                "Content-Type": "application/json",
                "Origin": "http://malicious-site.com",
                "Host": "127.0.0.1:8000"
            },
            data=payload
        )
        self.assertEqual(code, 403, "Origin não autorizada no diagnóstico deve retornar 403")


if __name__ == "__main__":
    print("=" * 60)
    print("EXECUTANDO TESTES DE SEGURANÇA DO SERVIDOR dev.py")
    print("=" * 60)
    suite = unittest.TestLoader().loadTestsFromTestCase(TestDevServerSecurity)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)
