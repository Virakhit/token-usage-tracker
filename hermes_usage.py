import json
import os
import sqlite3
from datetime import datetime
from pathlib import Path


def default_state_db():
    hermes_home = os.environ.get('HERMES_HOME')
    if hermes_home:
        return Path(hermes_home) / 'state.db'
    return Path(os.environ.get('LOCALAPPDATA', Path.home() / 'AppData/Local')) / 'hermes' / 'state.db'


def read_sessions(db_path=None):
    path = Path(db_path or default_state_db())
    if not path.exists():
        return []
    con = sqlite3.connect(path)
    con.row_factory = sqlite3.Row
    try:
        rows = con.execute('''
            SELECT id, started_at, model, model_config, input_tokens, output_tokens,
                   cache_read_tokens, cache_write_tokens, reasoning_tokens,
                   estimated_cost_usd, actual_cost_usd, title
            FROM sessions
            WHERE COALESCE(input_tokens, 0) + COALESCE(output_tokens, 0) > 0
            ORDER BY started_at DESC
        ''').fetchall()
    finally:
        con.close()
    result = []
    for row in rows:
        try:
            config = json.loads(row['model_config'] or '{}')
        except (TypeError, json.JSONDecodeError):
            config = {}
        runtime = config.get('gateway_runtime') or {}
        provider = runtime.get('provider') or config.get('provider') or 'unknown'
        started = datetime.fromtimestamp(row['started_at']).strftime('%Y-%m-%d') if row['started_at'] else ''
        result.append({
            'id': f"hermes:{row['id']}", 'date': started, 'provider': provider,
            'model': row['model'] or 'unknown', 'input': row['input_tokens'] or 0,
            'output': row['output_tokens'] or 0, 'cache_read': row['cache_read_tokens'] or 0,
            'cache_write': row['cache_write_tokens'] or 0, 'reasoning': row['reasoning_tokens'] or 0,
            'cost': row['actual_cost_usd'] if row['actual_cost_usd'] is not None else (row['estimated_cost_usd'] or 0),
            'note': f"Hermes · {row['title']}" if row['title'] else 'Hermes session', 'source': 'hermes'
        })
    return result


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Read Hermes token usage from state.db')
    parser.add_argument('--db', type=Path, default=None)
    args = parser.parse_args()
    print(json.dumps(read_sessions(args.db), ensure_ascii=False))
