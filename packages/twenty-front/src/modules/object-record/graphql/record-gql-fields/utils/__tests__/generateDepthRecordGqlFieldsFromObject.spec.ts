import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { generateDepthRecordGqlFieldsFromFields } from '@/object-record/graphql/record-gql-fields/utils/generateDepthRecordGqlFieldsFromFields';
import {
  clearDepthRecordGqlFieldsCache,
  generateDepthRecordGqlFieldsFromObject,
} from '@/object-record/graphql/record-gql-fields/utils/generateDepthRecordGqlFieldsFromObject';
import { type RecordGqlFields } from 'twenty-shared/types';

jest.mock(
  '@/object-record/graphql/record-gql-fields/utils/generateDepthRecordGqlFieldsFromFields',
  () => ({
    generateDepthRecordGqlFieldsFromFields: jest.fn(),
  }),
);

const mockedGenerateDepthRecordGqlFieldsFromFields =
  generateDepthRecordGqlFieldsFromFields as jest.MockedFunction<
    typeof generateDepthRecordGqlFieldsFromFields
  >;

const createMockObjectMetadataItem = ({
  id,
  fieldsCount,
}: {
  id: string;
  fieldsCount: number;
}): EnrichedObjectMetadataItem => {
  const fields = Array.from({ length: fieldsCount }, (_, index) => ({
    id: `${id}-field-${index}`,
    name: `field${index}`,
  }));

  return {
    id,
    fields,
  } as unknown as EnrichedObjectMetadataItem;
};

describe('generateDepthRecordGqlFieldsFromObject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearDepthRecordGqlFieldsCache();
  });

  it('should generate depth record gql fields on initial call', () => {
    const objectMetadataItem = createMockObjectMetadataItem({
      id: 'object-1',
      fieldsCount: 2,
    });
    const objectMetadataItems = [objectMetadataItem];
    const expectedFields: RecordGqlFields = {
      id: true,
      field0: true,
      field1: true,
    };

    mockedGenerateDepthRecordGqlFieldsFromFields.mockReturnValueOnce(
      expectedFields,
    );

    const result = generateDepthRecordGqlFieldsFromObject({
      objectMetadataItems,
      objectMetadataItem,
      depth: 1,
    });

    expect(result).toBe(expectedFields);
    expect(mockedGenerateDepthRecordGqlFieldsFromFields).toHaveBeenCalledTimes(
      1,
    );
    expect(mockedGenerateDepthRecordGqlFieldsFromFields).toHaveBeenCalledWith({
      objectMetadataItems,
      sourceObjectMetadataItem: objectMetadataItem,
      fields: objectMetadataItem.fields,
      depth: 1,
      shouldOnlyLoadRelationIdentifiers: true,
    });
  });

  it('should return cached results on subsequent calls with identical arguments without re-computing', () => {
    const objectMetadataItem = createMockObjectMetadataItem({
      id: 'object-1',
      fieldsCount: 2,
    });
    const objectMetadataItems = [objectMetadataItem];
    const expectedFields: RecordGqlFields = {
      id: true,
      field0: true,
    };

    mockedGenerateDepthRecordGqlFieldsFromFields.mockReturnValue(
      expectedFields,
    );

    const firstResult = generateDepthRecordGqlFieldsFromObject({
      objectMetadataItems,
      objectMetadataItem,
      depth: 1,
      shouldOnlyLoadRelationIdentifiers: true,
    });

    const secondResult = generateDepthRecordGqlFieldsFromObject({
      objectMetadataItems,
      objectMetadataItem,
      depth: 1,
      shouldOnlyLoadRelationIdentifiers: true,
    });

    expect(firstResult).toBe(expectedFields);
    expect(secondResult).toBe(firstResult);
    expect(mockedGenerateDepthRecordGqlFieldsFromFields).toHaveBeenCalledTimes(
      1,
    );
  });

  it('should produce cache misses and re-compute when depth changes', () => {
    const objectMetadataItem = createMockObjectMetadataItem({
      id: 'object-1',
      fieldsCount: 2,
    });
    const objectMetadataItems = [objectMetadataItem];
    const depthOneFields: RecordGqlFields = { id: true };
    const depthTwoFields: RecordGqlFields = {
      id: true,
      relation: { id: true },
    };

    mockedGenerateDepthRecordGqlFieldsFromFields
      .mockReturnValueOnce(depthOneFields)
      .mockReturnValueOnce(depthTwoFields);

    const firstResult = generateDepthRecordGqlFieldsFromObject({
      objectMetadataItems,
      objectMetadataItem,
      depth: 1,
    });

    const secondResult = generateDepthRecordGqlFieldsFromObject({
      objectMetadataItems,
      objectMetadataItem,
      depth: 2,
    });

    const cachedDepthOneResult = generateDepthRecordGqlFieldsFromObject({
      objectMetadataItems,
      objectMetadataItem,
      depth: 1,
    });

    expect(firstResult).toBe(depthOneFields);
    expect(secondResult).toBe(depthTwoFields);
    expect(cachedDepthOneResult).toBe(depthOneFields);
    expect(mockedGenerateDepthRecordGqlFieldsFromFields).toHaveBeenCalledTimes(
      2,
    );
    expect(
      mockedGenerateDepthRecordGqlFieldsFromFields,
    ).toHaveBeenNthCalledWith(1, {
      objectMetadataItems,
      sourceObjectMetadataItem: objectMetadataItem,
      fields: objectMetadataItem.fields,
      depth: 1,
      shouldOnlyLoadRelationIdentifiers: true,
    });
    expect(
      mockedGenerateDepthRecordGqlFieldsFromFields,
    ).toHaveBeenNthCalledWith(2, {
      objectMetadataItems,
      sourceObjectMetadataItem: objectMetadataItem,
      fields: objectMetadataItem.fields,
      depth: 2,
      shouldOnlyLoadRelationIdentifiers: true,
    });
  });

  it('should produce cache misses and re-compute when shouldOnlyLoadRelationIdentifiers changes', () => {
    const objectMetadataItem = createMockObjectMetadataItem({
      id: 'object-1',
      fieldsCount: 2,
    });
    const objectMetadataItems = [objectMetadataItem];
    const identifierOnlyFields: RecordGqlFields = {
      id: true,
      companyId: true,
    };
    const fullRelationFields: RecordGqlFields = {
      id: true,
      company: { id: true, name: true },
    };

    mockedGenerateDepthRecordGqlFieldsFromFields
      .mockReturnValueOnce(identifierOnlyFields)
      .mockReturnValueOnce(fullRelationFields);

    const defaultFlagResult = generateDepthRecordGqlFieldsFromObject({
      objectMetadataItems,
      objectMetadataItem,
      depth: 1,
    });

    const explicitTrueResult = generateDepthRecordGqlFieldsFromObject({
      objectMetadataItems,
      objectMetadataItem,
      depth: 1,
      shouldOnlyLoadRelationIdentifiers: true,
    });

    const explicitFalseResult = generateDepthRecordGqlFieldsFromObject({
      objectMetadataItems,
      objectMetadataItem,
      depth: 1,
      shouldOnlyLoadRelationIdentifiers: false,
    });

    expect(defaultFlagResult).toBe(identifierOnlyFields);
    expect(explicitTrueResult).toBe(identifierOnlyFields);
    expect(explicitFalseResult).toBe(fullRelationFields);
    expect(mockedGenerateDepthRecordGqlFieldsFromFields).toHaveBeenCalledTimes(
      2,
    );
    expect(
      mockedGenerateDepthRecordGqlFieldsFromFields,
    ).toHaveBeenNthCalledWith(1, {
      objectMetadataItems,
      sourceObjectMetadataItem: objectMetadataItem,
      fields: objectMetadataItem.fields,
      depth: 1,
      shouldOnlyLoadRelationIdentifiers: true,
    });
    expect(
      mockedGenerateDepthRecordGqlFieldsFromFields,
    ).toHaveBeenNthCalledWith(2, {
      objectMetadataItems,
      sourceObjectMetadataItem: objectMetadataItem,
      fields: objectMetadataItem.fields,
      depth: 1,
      shouldOnlyLoadRelationIdentifiers: false,
    });
  });

  it('should clear cached entries and force re-computation when clearDepthRecordGqlFieldsCache is called', () => {
    const objectMetadataItem = createMockObjectMetadataItem({
      id: 'object-1',
      fieldsCount: 2,
    });
    const objectMetadataItems = [objectMetadataItem];
    const initialFields: RecordGqlFields = { id: true };
    const recomputedFields: RecordGqlFields = { id: true, name: true };

    mockedGenerateDepthRecordGqlFieldsFromFields
      .mockReturnValueOnce(initialFields)
      .mockReturnValueOnce(recomputedFields);

    const firstResult = generateDepthRecordGqlFieldsFromObject({
      objectMetadataItems,
      objectMetadataItem,
      depth: 1,
    });

    clearDepthRecordGqlFieldsCache();

    const secondResult = generateDepthRecordGqlFieldsFromObject({
      objectMetadataItems,
      objectMetadataItem,
      depth: 1,
    });

    expect(firstResult).toBe(initialFields);
    expect(secondResult).toBe(recomputedFields);
    expect(mockedGenerateDepthRecordGqlFieldsFromFields).toHaveBeenCalledTimes(
      2,
    );
  });

  it('should invalidate cache when objectMetadataItem fields length changes', () => {
    const initialObjectMetadataItem = createMockObjectMetadataItem({
      id: 'object-1',
      fieldsCount: 1,
    });
    const updatedObjectMetadataItem = createMockObjectMetadataItem({
      id: 'object-1',
      fieldsCount: 2,
    });
    const oneFieldResult: RecordGqlFields = { id: true, field0: true };
    const twoFieldsResult: RecordGqlFields = {
      id: true,
      field0: true,
      field1: true,
    };

    mockedGenerateDepthRecordGqlFieldsFromFields
      .mockReturnValueOnce(oneFieldResult)
      .mockReturnValueOnce(twoFieldsResult);

    const firstResult = generateDepthRecordGqlFieldsFromObject({
      objectMetadataItems: [initialObjectMetadataItem],
      objectMetadataItem: initialObjectMetadataItem,
      depth: 1,
    });

    const secondResult = generateDepthRecordGqlFieldsFromObject({
      objectMetadataItems: [updatedObjectMetadataItem],
      objectMetadataItem: updatedObjectMetadataItem,
      depth: 1,
    });

    expect(firstResult).toBe(oneFieldResult);
    expect(secondResult).toBe(twoFieldsResult);
    expect(mockedGenerateDepthRecordGqlFieldsFromFields).toHaveBeenCalledTimes(
      2,
    );
    expect(
      mockedGenerateDepthRecordGqlFieldsFromFields,
    ).toHaveBeenNthCalledWith(2, {
      objectMetadataItems: [updatedObjectMetadataItem],
      sourceObjectMetadataItem: updatedObjectMetadataItem,
      fields: updatedObjectMetadataItem.fields,
      depth: 1,
      shouldOnlyLoadRelationIdentifiers: true,
    });
  });

  it('should invalidate cache when objectMetadataItem id or objectMetadataItems length changes', () => {
    const firstObjectMetadataItem = createMockObjectMetadataItem({
      id: 'object-1',
      fieldsCount: 1,
    });
    const secondObjectMetadataItem = createMockObjectMetadataItem({
      id: 'object-2',
      fieldsCount: 1,
    });
    const firstResultFields: RecordGqlFields = { id: true };
    const secondObjectResultFields: RecordGqlFields = { id: true, name: true };
    const expandedItemsResultFields: RecordGqlFields = {
      id: true,
      relation: { id: true },
    };

    mockedGenerateDepthRecordGqlFieldsFromFields
      .mockReturnValueOnce(firstResultFields)
      .mockReturnValueOnce(secondObjectResultFields)
      .mockReturnValueOnce(expandedItemsResultFields);

    const firstResult = generateDepthRecordGqlFieldsFromObject({
      objectMetadataItems: [firstObjectMetadataItem],
      objectMetadataItem: firstObjectMetadataItem,
      depth: 1,
    });

    const differentIdResult = generateDepthRecordGqlFieldsFromObject({
      objectMetadataItems: [secondObjectMetadataItem],
      objectMetadataItem: secondObjectMetadataItem,
      depth: 1,
    });

    const differentItemsLengthResult = generateDepthRecordGqlFieldsFromObject({
      objectMetadataItems: [firstObjectMetadataItem, secondObjectMetadataItem],
      objectMetadataItem: firstObjectMetadataItem,
      depth: 1,
    });

    expect(firstResult).toBe(firstResultFields);
    expect(differentIdResult).toBe(secondObjectResultFields);
    expect(differentItemsLengthResult).toBe(expandedItemsResultFields);
    expect(mockedGenerateDepthRecordGqlFieldsFromFields).toHaveBeenCalledTimes(
      3,
    );
  });
});
