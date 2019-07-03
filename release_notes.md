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