
from datetime import datetime

from models import Appointment, DoctorBlackout


SLOT_MINUTES = 30
ACTIVE_STATUSES = ['pending', 'confirmed']


# --------------------------------------------------
# TIME CONVERSION
# --------------------------------------------------

def to_minutes(hhmm):
    """Convert HH:MM to minutes since midnight."""

    hours, minutes = map(int, hhmm.split(':'))
    return hours * 60 + minutes


# --------------------------------------------------
# BLACKOUT TIME WINDOW
# --------------------------------------------------

def blackout_window(blackout):
    """Return blackout start and end times in minutes."""

    # No specific times means full-day blackout
    if blackout.start_time is None or blackout.end_time is None:
        return 0, 1440

    return (
        to_minutes(blackout.start_time),
        to_minutes(blackout.end_time)
    )


# --------------------------------------------------
# CHECK SLOT OVERLAPPING
# --------------------------------------------------

def slot_overlaps_windows(slot_time, win_start, win_end):
    """Check whether a 30-minute slot overlaps a time window."""

    slot_start = to_minutes(slot_time)
    slot_end = slot_start + SLOT_MINUTES

    return slot_start < win_end and slot_end > win_start


# --------------------------------------------------
# GET DOCTOR BLACKOUTS FOR A DATE
# --------------------------------------------------

def blackouts_for_date(doctor_id, date_str):
    """Get all doctor blackouts covering the specified date."""

    return DoctorBlackout.query.filter(
        DoctorBlackout.doctor_id == doctor_id,
        DoctorBlackout.start_date <= date_str,
        DoctorBlackout.end_date >= date_str
    ).all()


# --------------------------------------------------
# GET BLOCKED SLOTS AND DAY STATUS
# --------------------------------------------------

def get_blocked_info(doctor, date_str):
    """
    Return:
        (day_blocked, blocked_slots)

    day_blocked:
        True if every generated working slot is blocked.

    blocked_slots:
        List of unavailable 30-minute slot start times.
    """

    blackouts = blackouts_for_date(doctor.id, date_str)

    if not blackouts:
        return False, []

    windows = [
        blackout_window(blackout)
        for blackout in blackouts
    ]

    blocked = []

    current = to_minutes(doctor.available_from)
    end = to_minutes(doctor.available_to)

    total_slots = 0

    while current + SLOT_MINUTES <= end:

        slot = f"{current // 60:02d}:{current % 60:02d}"

        total_slots += 1

        if any(
            slot_overlaps_windows(slot, win_start, win_end)
            for win_start, win_end in windows
        ):
            blocked.append(slot)

        current += SLOT_MINUTES

    day_blocked = (
        total_slots > 0
        and len(blocked) == total_slots
    )

    return day_blocked, blocked


# --------------------------------------------------
# CHECK WHETHER A SLOT IS BLOCKED
# --------------------------------------------------

def is_slot_blocked(doctor_id, date_str, time_str):
    """Check whether a requested slot overlaps a blackout."""

    for blackout in blackouts_for_date(doctor_id, date_str):

        win_start, win_end = blackout_window(blackout)

        if slot_overlaps_windows(
            time_str,
            win_start,
            win_end
        ):
            return True

    return False


# --------------------------------------------------
# CHECK WHETHER A SLOT IS ALREADY BOOKED
# --------------------------------------------------

def is_slot_booked(
    doctor_id,
    date_str,
    time_str,
    exclude_apt_id=None
):
    """
    Check whether a requested 30-minute slot overlaps
    an existing pending or confirmed appointment.

    exclude_apt_id allows the current appointment to be
    ignored during rescheduling.
    """

    query = Appointment.query.filter(
        Appointment.doctor_id == doctor_id,
        Appointment.date == date_str,
        Appointment.status.in_(ACTIVE_STATUSES)
    )

    if exclude_apt_id is not None:
        query = query.filter(
            Appointment.id != exclude_apt_id
        )

    appointments = query.all()

    requested_start = to_minutes(time_str)
    requested_end = requested_start + SLOT_MINUTES

    for appointment in appointments:

        existing_start = to_minutes(appointment.time)
        existing_end = existing_start + SLOT_MINUTES

        if (
            requested_start < existing_end
            and requested_end > existing_start
        ):
            return True

    return False


# --------------------------------------------------
# FIND APPOINTMENTS CLASHING WITH BLACKOUT
# --------------------------------------------------

def find_clashing_appointments(
    doctor_id,
    start_date,
    end_date,
    start_time=None,
    end_time=None
):
    """
    Find active appointments overlapping a blackout
    date and time window.
    """

    appointments = Appointment.query.filter(
        Appointment.doctor_id == doctor_id,
        Appointment.status.in_(ACTIVE_STATUSES),
        Appointment.date >= start_date,
        Appointment.date <= end_date
    ).order_by(
        Appointment.date,
        Appointment.time
    ).all()

    # No specific time means full-day blackout
    if start_time is None or end_time is None:
        win_start, win_end = 0, 1440

    else:
        win_start = to_minutes(start_time)
        win_end = to_minutes(end_time)

    return [
        appointment
        for appointment in appointments
        if slot_overlaps_windows(
            appointment.time,
            win_start,
            win_end
        )
    ]


# --------------------------------------------------
# FORMAT APPOINTMENT DATE AND TIME
# --------------------------------------------------

def format_slot(date_str, time_str):
    """Format a date and time like 20 Nov 2026 at 10:00."""

    try:
        date_obj = datetime.strptime(
            date_str,
            "%Y-%m-%d"
        )

        formatted_date = date_obj.strftime("%d %b %Y")

        return f"{formatted_date} at {time_str}"

    except (ValueError, TypeError):
        return f"{date_str} at {time_str}"
