// Stand-in for the socket.io layer in REST tests.
export function createFakeRealtime() {
  const emitted = [];
  const online = new Set();

  return {
    emitted,
    emitToUsers(userIds, event, payload) {
      emitted.push({ userIds: userIds.map(String), event, payload });
    },
    onlineIds(ids) {
      return ids.map(String).filter((id) => online.has(id));
    },
    setOnline(ids) {
      online.clear();
      ids.forEach((id) => online.add(String(id)));
    },
    // Convenience for assertions: every user id an event was sent to.
    recipientsOf(event) {
      return emitted.filter((e) => e.event === event).flatMap((e) => e.userIds);
    },
  };
}
