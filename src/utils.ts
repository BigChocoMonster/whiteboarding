export function saveShapesToMemory<T>(shapes: T) {
  localStorage.setItem("shapes", JSON.stringify(shapes));
}

export function retrieveShapesFromMemory() {
  /**
   * This is coming from user's previous session.
   */
  try {
    return JSON.parse(localStorage.getItem("shapes") || "");
  } catch {
    return [];
  }
}
