import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { generateDepthRecordGqlFieldsFromFields } from '@/object-record/graphql/record-gql-fields/utils/generateDepthRecordGqlFieldsFromFields';
import { type RecordGqlFields } from 'twenty-shared/types';

export type GenerateDepthRecordGqlFields = {
  objectMetadataItems: EnrichedObjectMetadataItem[];
  objectMetadataItem: Pick<EnrichedObjectMetadataItem, 'id' | 'fields'>;
  depth: 0 | 1;
  shouldOnlyLoadRelationIdentifiers?: boolean;
};

const depthRecordGqlFieldsCache = new Map<string, RecordGqlFields>();

export const clearDepthRecordGqlFieldsCache = () => {
  depthRecordGqlFieldsCache.clear();
};

export const generateDepthRecordGqlFieldsFromObject = ({
  objectMetadataItems,
  objectMetadataItem,
  depth,
  shouldOnlyLoadRelationIdentifiers = true,
}: GenerateDepthRecordGqlFields): RecordGqlFields => {
  const cacheKey = `${objectMetadataItem.id}:${depth}:${shouldOnlyLoadRelationIdentifiers}:${objectMetadataItem.fields.length}:${objectMetadataItems.length}`;
  const cached = depthRecordGqlFieldsCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const generated = generateDepthRecordGqlFieldsFromFields({
    objectMetadataItems,
    sourceObjectMetadataItem: objectMetadataItem,
    fields: objectMetadataItem.fields,
    depth,
    shouldOnlyLoadRelationIdentifiers,
  });

  depthRecordGqlFieldsCache.set(cacheKey, generated);

  return generated;
};
