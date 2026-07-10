from datetime import date, datetime
from zoneinfo import ZoneInfo

IST = ZoneInfo("Asia/Kolkata")


def to_date(v):
    return v.date() if hasattr(v, "date") else v


def ist_today():
    return datetime.now(IST).date()


def ist_today_start():
    d = ist_today()
    return datetime(d.year, d.month, d.day)
