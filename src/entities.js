const ObjectId = require('mongoose').Types.ObjectId;
const logger = require('winston');
const _ = require('lodash');

module.exports = {
    isObjectId(obj) {
        if (!obj)
            return false;

        if (obj instanceof ObjectId || obj._bsontype === 'ObjectID')
            return true;

        if (typeof obj === 'string')
            return (obj.length === 24) && ObjectId.isValid(obj);

        return false;
    },

    getId(entity) {
        return (this.isObjectId(entity) ? entity : (entity && entity._id)) || entity;
    },

    getObjectId(id) {
        if (!this.isObjectId(id))
            id = this.getId(id);

        if (this.isObjectId(id))
            return ObjectId(id);

        if (id != null)
            logger.warn(`object ${id} could not be parsed to an ObjectId at: \r\n${(new Error().stack.slice(10))}`);
    },

    toObjectIds(array) {
        if (!array || !array.length)
            return array;

        return array.map(x => this.getObjectId(x));
    },

    objectIdsEqual(first, second) {
        if (typeof first === 'object')
            first = this.getObjectId(first);

        if (typeof second === 'object')
            second = this.getObjectId(second);

        if (!first || !second)
            return false;

        return first.toString() === second.toString();
    },

    objectIdToInt(objectId) {
        return parseInt(objectId.toString().substring(8), 16) || 0;
    },

    toObject(entity) {
        return (entity && entity.toObject) ? entity.toObject() : entity;
    },

    toObjects(array) {
        return (array && array.length) ? array.map(x => this.toObject(x)) : array;
    },

    toObjectRecursive(any) {
        if (any && _.isObject(any)) {
            if (any.toObject)
                return any.toObject();
            _.forIn(any, (val, key) => {
                if (_.isArray(val))
                    any[key] = val.map(element => this.toObjectRecursive(element));

                else
                    any[key] = this.toObjectRecursive(val);
            });
        }
        return any;
    },

    /**
     * Same as lodash clone deep, with support for ObjectId
     * @param source
     */
    cloneDeepWithObjectIds(source) {
        return _.cloneDeep(source, value => {
            if (value instanceof ObjectId)
                return new ObjectId(value.toString())
        })
    },

    /**
     * Populates {@param sourceSet} values from {@param associationSet} by matching {@param sourcePath}
     * in {@param sourceSet} against {@param associationPath} in {@param associationSet}.
     * @param sourceSet {Array}
     * @param associationSet {Array}
     * @param sourcePath {String}
     * @param associationPath {String}
     * @returns {*}
     */
    populate(sourceSet, associationSet, sourcePath, associationPath) {
        if (!sourceSet || !sourceSet.length || !associationSet || !associationSet.length)
            return sourceSet;

        let associationMap = this.toHashtable(associationSet, x => _.get(x, associationPath));
        sourceSet.forEach(source => {
            let foreignKey = _.get(source, sourcePath);
            let association = associationMap[foreignKey];
            if (association)
                _.set(source, sourcePath, association);
        });

        return sourceSet;
    },

    emptyObjectId() {
        return ObjectId('000000000000000000000000');
    }
};