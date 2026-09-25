class DailyCap:
    def __init__(self, limit: int):
        self.limit = limit
        self.count = 0

    def allow(self) -> bool:
        if self.count >= self.limit:
            return False
        self.count += 1
        return True
