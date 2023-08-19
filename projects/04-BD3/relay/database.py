
import rocksdb

db_conn = None

def get_conn():
    global db_conn
    if not db_conn:
        db_conn = rocksdb.DB('test.db', rocksdb.Options(create_if_missing=True))
    return db_conn
