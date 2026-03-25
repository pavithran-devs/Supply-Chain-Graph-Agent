import collections

class MemoryManager:
    def __init__(self, buffer_size=10, entity_limit=3):
        self.conversation_buffer = collections.deque(maxlen=buffer_size)
        self.recent_entities = collections.deque(maxlen=entity_limit)

    def add_message(self, role, content):
        self.conversation_buffer.append({"role": role, "content": content})

    def add_entities(self, entities):
        if not entities:
            return
        # Add entities while maintaining uniqueness and keeping most recent at the end
        for entity in entities:
            if entity in self.recent_entities:
                self.recent_entities.remove(entity)
            self.recent_entities.append(entity)

    def get_context_string(self):
        entities = list(self.recent_entities)
        if not entities:
            return "No active context."
        return f"Current investigation context: {entities}."

    def get_history(self):
        return list(self.conversation_buffer)

# Global singleton for the local session
memory = MemoryManager()
