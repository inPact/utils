# @tabit/utils release notes

### 3.7.3
* add winston transports only if absent

### 3.7.2
* winston internal fix
* (this version is intended to replace the current latest v4.0.2 which is not compatible with ros due to the mongoose update)

### 3.7.1
* Retry: print wait message only if actually waiting

## 3.7.0
* add Retry

### 3.6.1
* support undefined / null in strings.smartSplit

## 3.6.0
* added strings.smartSplit

## 3.5.0
* added arrays.addToSet
* merged arrays.replaceElement and arrays.replaceElementBy

## 3.4.0
* split collection-related functions out of 'extend' into 'arrays'
* added arrays.replaceElement and arrays.replaceElementBy

## 3.3.0
* removed metrics

### 3.2.12
* lock: await the specified action; separate pending-lock from open-lock traces

## 3.2.0
* added reflect.getCallingFunctionNameAndLocation

## 3.1.0
* added reflect.getFunctionArguments

### 3.0.5
* diff: revert back to _.transform (strange behavior on linux not resolved)

### 3.0.4
* diff: change to _.each (strange behavior on linux occasionally treats object as array)

### 3.0.3
* diff: change to _.reduce (strange behavior on linux occasionally treats object as array)

### 3.0.2
* diff: force results into object (strange behavior on linux occasionally treats object as array)

### 3.0.1
* flattenObjects no longer flattens out the contents of arrays

# 3.0.0
* lodash-4 abandoned (revert to lodash-3)

## 2.1.0
* renamed 'includeUtils' to 'use'
* added 'sumSafe' method that mimics lodash-3 'sum' behavior that was broken in lodash-4

# 2.0.0
* renamed 'append' to 'includeUtils'
* added extend.getFirst

### 1.2.2
* Appending new functions is now done explicitly to reduce chaos

## 1.2.0
* Added functions now exported to moredash
