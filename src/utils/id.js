// WWebJS sometimes delivers ids as plain strings and sometimes as serialized
// WID-like objects (e.g. { user, server, _serialized }), depending on the event.
function toSerializedId(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value._serialized) return value._serialized;
  if (typeof value === 'object' && value.user && value.server) {
    return `${value.user}@${value.server}`;
  }
  return null;
}

module.exports = { toSerializedId };
