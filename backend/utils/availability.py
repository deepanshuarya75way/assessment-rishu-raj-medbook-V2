

from datetime import datetime
from models import Appointment, DoctorBlackout

SLOT_MINUTES = 30
ACTIVE_STATUSES = ['pending', 'confirmed']


def to_minutes(hhmm):
    """Convert HH:MM to minutes since midnight."""
    hours, minutes = map(int, hhmm.split(':'))
    return hours * 60 + minutes


def blackout_window(blackout):
    """Return blackout start and end times in minutes."""
    if blackout.start_time is None or blackout.end_time is None:
        return (0, 1440)

    return (
        to_minutes(blackout.start_time),
        to_minutes(blackout.end_time)
    )


def slot_overlaps_windows(slot_time, win_start, win_end):
    """Check whether a 30-minute slot overlaps a given time window."""
    slot_start = to_minutes(slot_time)
    slot_end = slot_start + SLOT_MINUTES

    return slot_start < win_end and slot_end > win_start


def blackouts_for_date(doctor_id, date_str):
    """Get all doctor blackouts covering the specified date."""
    return DoctorBlackout.query.filter(
        DoctorBlackout.doctor_id == doctor_id,
        DoctorBlackout.start_date <= date_str,
        DoctorBlackout.end_date >= date_str
    ).all()


def get_blocked_info(doctor,date_str):
    """Check whether a 30-minute slot overlaps any doctor blackout."""
    blackouts = blackouts_for_date(doctor_id, date_str)
    if not blackouts:
      return False, []

      blocked = []
      current = to_minutes(doctor.available_from)
      end = to_minutes(doctor.available_to)
      while current < end:
        slot = f"{current//60:02d}:{current % 60:02d}"
        if any (slot_overlaps_windows(slot,ws we) for ws , we in windows):
           blocked.append(slot)
           current += SLOT_MINUTES
      return day_blocked , blocked   


def is_slot_blocked(doctor_id, date_str, time_str):
   for b in blackouts_for_date(doctor_id date_str):
    ws, we = blackout_windows(b)
    if slot_overlaps_windows (time_str, ws, we):
      return True
      return False



def find_clashing_appointments(
    doctor_id,
    start_date,
    end_date,
    start_time=None,
    end_time=None
):
    """Find active appointments overlapping the requested time window."""
    appointments = Appointment.query.filter(
        Appointment.doctor_id == doctor_id,
        Appointment.status.in_(ACTIVE_STATUSES),
        Appointment.date >= start_date,
        Appointment.date <= end_date
    ).order_by(
        Appointment.date,
        Appointment.time
    ).all()

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


def format_slot(date_str, time_str):
    """Format a date and time like 20 NOV 2026 at 10:00."""
    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        formatted_date = date_obj.strftime("%d %b %Y")
        return f"{formatted_date} at {time_str}"
    except (ValueError, TypeError):
        return f"{date_str} at {time_str}"
