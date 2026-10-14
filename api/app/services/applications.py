from ..models import Stage

_FORWARD = {
    Stage.RESEARCHING: Stage.CONTACTED,
    Stage.CONTACTED: Stage.APPLYING,
    Stage.APPLYING: Stage.SUBMITTED,
    Stage.SUBMITTED: Stage.INTERVIEW,
    Stage.INTERVIEW: Stage.OFFER,
}

_TERMINAL = {Stage.OFFER, Stage.REJECTED, Stage.WITHDRAWN}


def is_valid_transition(current: Stage, target: Stage) -> bool:
    if target == current:
        return True
    if target in (Stage.REJECTED, Stage.WITHDRAWN):
        return True
    if current in _TERMINAL:
        return False
    return _FORWARD.get(current) == target
