import { act, renderHook } from '@testing-library/react';
import { createStore, Provider as JotaiProvider } from 'jotai';
import { type ReactNode } from 'react';

import { contextStoreCurrentViewIdComponentState } from '@/context-store/states/contextStoreCurrentViewIdComponentState';
import { useSetViewTypeFromLayoutOptionsMenu } from '@/object-record/object-options-dropdown/hooks/useSetViewTypeFromLayoutOptionsMenu';
import { viewsSelector } from '@/views/states/selectors/viewsSelector';
import { type GraphQLView } from '@/views/types/GraphQLView';
import { ViewType } from '@/views/types/ViewType';

const mockUpdateCurrentView = jest.fn();
const mockSetRecordIndexViewType = jest.fn();

jest.mock('@/context-store/hooks/useContextStoreInstanceId', () => ({
  useContextStoreInstanceId: () => 'test-context-store-id',
}));

jest.mock('@/views/hooks/useUpdateCurrentView', () => ({
  useUpdateCurrentView: () => ({ updateCurrentView: mockUpdateCurrentView }),
}));

jest.mock('@/ui/utilities/state/jotai/hooks/useSetAtomComponentState', () => ({
  useSetAtomComponentState: () => mockSetRecordIndexViewType,
}));

jest.mock('@/object-record/record-index/contexts/RecordIndexContext', () => ({
  useRecordIndexContextOrThrow: () => ({
    objectMetadataItem: { id: 'opportunity-metadata', nameSingular: 'opportunity' },
  }),
}));

jest.mock('@/object-record/record-index/hooks/useLoadRecordIndexStates', () => ({
  useLoadRecordIndexStates: () => ({ loadRecordIndexStates: jest.fn() }),
}));

jest.mock('@/views/view-picker/hooks/useGetAvailableFieldsForCalendar', () => ({
  useGetAvailableFieldsForCalendar: () => ({ availableFieldsForCalendar: [] }),
}));

const mockAvailableFieldsForGrouping = [
  { id: 'company-field-id', name: 'company' },
  { id: 'stage-field-id', name: 'stage' },
];

jest.mock('@/views/view-picker/hooks/useGetAvailableFieldsToGroupRecordsBy', () => ({
  useGetAvailableFieldsToGroupRecordsBy: () => ({
    availableFieldsForGrouping: mockAvailableFieldsForGrouping,
  }),
}));

describe('useSetViewTypeFromLayoutOptionsMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = (currentViewOverrides: Partial<GraphQLView> = {}) => {
    const store = createStore();
    const currentView: GraphQLView = {
      id: 'view-1',
      type: ViewType.KANBAN,
      name: 'Opportunities By Stage',
      icon: 'IconLayoutKanban',
      mainGroupByFieldMetadataId: 'stage-field-id',
      ...currentViewOverrides,
    } as GraphQLView;

    store.set(
      contextStoreCurrentViewIdComponentState.atomFamily({
        instanceId: 'test-context-store-id',
      }),
      'view-1',
    );

    store.set(viewsSelector.atom, [currentView]);

    const wrapper = ({ children }: { children: ReactNode }) => (
      <JotaiProvider store={store}>{children}</JotaiProvider>
    );

    const { result } = renderHook(() => useSetViewTypeFromLayoutOptionsMenu(), {
      wrapper,
    });

    return { result, store };
  };

  it('should not clear mainGroupByFieldMetadataId when switching to TABLE layout (#29439)', async () => {
    const { result } = setup({
      type: ViewType.KANBAN,
      mainGroupByFieldMetadataId: 'stage-field-id',
    });

    await act(async () => {
      await result.current.setAndPersistViewType(ViewType.TABLE);
    });

    expect(mockUpdateCurrentView).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ViewType.TABLE,
      }),
    );
    expect(mockUpdateCurrentView).not.toHaveBeenCalledWith(
      expect.objectContaining({
        mainGroupByFieldMetadataId: null,
      }),
    );
  });

  it('should preserve existing valid mainGroupByFieldMetadataId when switching back to KANBAN layout (#29439)', async () => {
    const { result } = setup({
      type: ViewType.TABLE,
      mainGroupByFieldMetadataId: 'stage-field-id',
    });

    await act(async () => {
      await result.current.setAndPersistViewType(ViewType.KANBAN);
    });

    expect(mockUpdateCurrentView).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ViewType.KANBAN,
        mainGroupByFieldMetadataId: 'stage-field-id',
      }),
    );
  });

  it('should fallback to availableFieldsForGrouping[0] when mainGroupByFieldMetadataId is not defined', async () => {
    const { result } = setup({
      type: ViewType.TABLE,
      mainGroupByFieldMetadataId: null,
    });

    await act(async () => {
      await result.current.setAndPersistViewType(ViewType.KANBAN);
    });

    expect(mockUpdateCurrentView).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ViewType.KANBAN,
        mainGroupByFieldMetadataId: 'company-field-id',
      }),
    );
  });
});
