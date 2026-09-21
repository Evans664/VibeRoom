export const appState = {
  mode: 'guest',
  currentUser: null,
  activePage: 'home'
};

export function updateState(changes) {
  Object.assign(appState, changes);
  return appState;
}
