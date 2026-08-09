import { SessionUiStateService } from './session-ui-state.service';

const ENTRY_ID: string = 'a3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
const ITEM_ID: string = 'b4e2d3c5-6f7a-4b8c-9d0e-1f2a3b4c5d6e';
const STORAGE_KEY: string = `progress.session.active-item.${ENTRY_ID}`;

describe('SessionUiStateService', () => {
  let service: SessionUiStateService;

  beforeEach(() => {
    localStorage.clear();
    service = new SessionUiStateService();
  });

  it('round-trips the active item for an entry', () => {
    service.setActiveItemId(ENTRY_ID, ITEM_ID);

    expect(service.getActiveItemId(ENTRY_ID)).toBe(ITEM_ID);
  });

  it('returns null when nothing has been stored', () => {
    expect(service.getActiveItemId(ENTRY_ID)).toBeNull();
  });

  it('keeps entries separate so one session cannot read another', () => {
    service.setActiveItemId(ENTRY_ID, ITEM_ID);

    expect(service.getActiveItemId('99999999-9999-4999-8999-999999999999')).toBeNull();
  });

  it('rejects a stored value that is not a uuid', () => {
    // Another tab, an older build, or devtools can all put arbitrary text here.
    localStorage.setItem(STORAGE_KEY, 'not-a-uuid');

    expect(service.getActiveItemId(ENTRY_ID)).toBeNull();
  });

  it('clears the stored item', () => {
    service.setActiveItemId(ENTRY_ID, ITEM_ID);

    service.clear(ENTRY_ID);

    expect(service.getActiveItemId(ENTRY_ID)).toBeNull();
  });

  it('degrades to null rather than throwing when storage is unavailable', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    expect(() => service.getActiveItemId(ENTRY_ID)).not.toThrow();
    expect(service.getActiveItemId(ENTRY_ID)).toBeNull();

    getItem.mockRestore();
  });

  it('swallows a write failure so a full quota cannot break a workout', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => service.setActiveItemId(ENTRY_ID, ITEM_ID)).not.toThrow();

    setItem.mockRestore();
  });
});
