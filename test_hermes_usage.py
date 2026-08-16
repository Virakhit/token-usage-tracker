import sqlite3
import tempfile
import unittest
from pathlib import Path
from hermes_usage import read_sessions

class HermesUsageTests(unittest.TestCase):
    def test_reads_session_token_usage_and_provider(self):
        with tempfile.TemporaryDirectory() as d:
            db = Path(d) / 'state.db'
            con = sqlite3.connect(db)
            con.execute('CREATE TABLE sessions (id TEXT, started_at REAL, model TEXT, model_config TEXT, input_tokens INTEGER, output_tokens INTEGER, cache_read_tokens INTEGER, cache_write_tokens INTEGER, reasoning_tokens INTEGER, estimated_cost_usd REAL, actual_cost_usd REAL, title TEXT, source TEXT)')
            con.execute('INSERT INTO sessions VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', ('s1', 1700000000, 'gpt-test', '{"gateway_runtime":{"provider":"openai-api"}}', 10, 4, 2, 1, 0, 0.12, None, 'Test', 'discord'))
            con.commit(); con.close()
            self.assertEqual(read_sessions(db), [{
                'id': 'hermes:s1', 'date': __import__('datetime').datetime.fromtimestamp(1700000000).strftime('%Y-%m-%d'), 'provider': 'openai-api', 'model': 'gpt-test',
                'input': 10, 'output': 4, 'cache_read': 2, 'cache_write': 1, 'reasoning': 0,
                'cost': 0.12, 'note': 'Hermes · Test', 'source': 'hermes'
            }])

if __name__ == '__main__': unittest.main()
