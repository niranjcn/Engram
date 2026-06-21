from datetime import date, datetime


def to_date(v):
    return v.date() if hasattr(v, "date") else v
