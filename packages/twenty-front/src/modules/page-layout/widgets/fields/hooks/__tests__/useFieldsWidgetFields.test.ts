import { renderHook } from '@testing-library/react';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { useFieldsWidgetFields } from '../useFieldsWidgetFields';

let mockHiddenFields: string[] = [];

jest.mock(
  '@/object-core/workflows/hooks/useHiddenWorkspaceWorkflowRunRelationFields',
  () => ({
    useHiddenWorkspaceWorkflowRunRelationFields: () => mockHiddenFields,
  }),
);

describe('useFieldsWidgetFields', () => {
  beforeEach(() => {
    mockHiddenFields = [];
  });

  const fieldA = {
    id: 'field-1',
    name: 'accessibleField',
    label: 'Accessible Field',
  } as FieldMetadataItem;

  const fieldB = {
    id: 'field-2',
    name: 'noAccessField',
    label: 'No Access Field',
  } as FieldMetadataItem;

  it('should return empty array when objectMetadataItem is undefined', () => {
    const { result } = renderHook(() => useFieldsWidgetFields(undefined));

    expect(result.current).toEqual([]);
  });

  it('should return empty array when readableFields is undefined or empty', () => {
    const objectMetadataItem = {
      nameSingular: 'company',
      fields: [fieldA, fieldB],
      readableFields: undefined,
    } as unknown as EnrichedObjectMetadataItem;

    const { result } = renderHook(() =>
      useFieldsWidgetFields(objectMetadataItem),
    );

    expect(result.current).toEqual([]);
  });

  it('should filter fields by readableFields to exclude fields with No Access (#29397)', () => {
    const objectMetadataItem = {
      nameSingular: 'company',
      fields: [fieldA, fieldB],
      readableFields: [fieldA], // fieldB has No Access so it is omitted from readableFields
    } as unknown as EnrichedObjectMetadataItem;

    const { result } = renderHook(() =>
      useFieldsWidgetFields(objectMetadataItem),
    );

    expect(result.current).toEqual([fieldA]);
    expect(result.current).not.toContain(fieldB);
  });

  it('should filter out hidden relation fields matching hiddenFieldMetadataIdsOrNames', () => {
    mockHiddenFields = ['accessibleField'];

    const objectMetadataItem = {
      nameSingular: 'company',
      fields: [fieldA],
      readableFields: [fieldA],
    } as unknown as EnrichedObjectMetadataItem;

    const { result } = renderHook(() =>
      useFieldsWidgetFields(objectMetadataItem),
    );

    expect(result.current).toEqual([]);
  });
});
