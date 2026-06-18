from datetime import date, timedelta

def run_sm2(problem, outcome: str) -> dict:
    quality = 5 if outcome == "solved_solo" else 3 if outcome == "used_hint" else 1
    interval = problem.interval
    ease_factor = problem.ease_factor
    repetitions = problem.repetitions
    solo_streak = problem.solo_streak

    if quality < 3:
        interval = 1
        repetitions = 0
        solo_streak = 0
    else:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 3
        else:
            interval = round(interval * ease_factor)
        repetitions += 1

    solo_streak = solo_streak + 1 if outcome == "solved_solo" else 0
    ease_factor = max(1.3, ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    frozen = interval > 21 and solo_streak >= 3

    if problem.repetitions == 0:
        if outcome == "solved_solo":
            interval = 3
        elif outcome == "used_hint":
            interval = 1
        else:
            interval = 1

    next_review = date.today() + timedelta(days=interval)
    return {
        "interval": interval,
        "ease_factor": ease_factor,
        "repetitions": repetitions,
        "solo_streak": solo_streak,
        "frozen": frozen,
        "next_review_date": next_review,
        "last_outcome": outcome,
    }
