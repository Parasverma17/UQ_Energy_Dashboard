from pathlib import Path

BASE = Path(__file__).resolve().parents[2] / "queries"

# loads sql query from database/queries directory
def load_query(name: str) -> str:
    """Load an .sql file by base filename (without extension)."""
    path = BASE / f"{name}.sql"
    if not path.exists():
        raise FileNotFoundError(f"SQL file {path} not found")
    return path.read_text()

