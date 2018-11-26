'use strict'

Object.defineProperty(exports, '__esModule', { value: true })

function _interopDefault(ex) {
  return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex
}

var redux = require('redux')
var memoizeOne = _interopDefault(require('memoize-one'))
var produce = _interopDefault(require('immer'))
var thunk = _interopDefault(require('redux-thunk'))
var shallowEqual = _interopDefault(require('shallowequal'))
var React = require('react')
var React__default = _interopDefault(React)

function _typeof(obj) {
  if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
    _typeof = function(obj) {
      return typeof obj
    }
  } else {
    _typeof = function(obj) {
      return obj &&
        typeof Symbol === 'function' &&
        obj.constructor === Symbol &&
        obj !== Symbol.prototype
        ? 'symbol'
        : typeof obj
    }
  }

  return _typeof(obj)
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    })
  } else {
    obj[key] = value
  }

  return obj
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {}
    var ownKeys = Object.keys(source)

    if (typeof Object.getOwnPropertySymbols === 'function') {
      ownKeys = ownKeys.concat(
        Object.getOwnPropertySymbols(source).filter(function(sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable
        }),
      )
    }

    ownKeys.forEach(function(key) {
      _defineProperty(target, key, source[key])
    })
  }

  return target
}

function _slicedToArray(arr, i) {
  return (
    _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest()
  )
}

function _toConsumableArray(arr) {
  return (
    _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread()
  )
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++)
      arr2[i] = arr[i]

    return arr2
  }
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr
}

function _iterableToArray(iter) {
  if (
    Symbol.iterator in Object(iter) ||
    Object.prototype.toString.call(iter) === '[object Arguments]'
  )
    return Array.from(iter)
}

function _iterableToArrayLimit(arr, i) {
  var _arr = []
  var _n = true
  var _d = false
  var _e = undefined

  try {
    for (
      var _i = arr[Symbol.iterator](), _s;
      !(_n = (_s = _i.next()).done);
      _n = true
    ) {
      _arr.push(_s.value)

      if (i && _arr.length === i) break
    }
  } catch (err) {
    _d = true
    _e = err
  } finally {
    try {
      if (!_n && _i['return'] != null) _i['return']()
    } finally {
      if (_d) throw _e
    }
  }

  return _arr
}

function _nonIterableSpread() {
  throw new TypeError('Invalid attempt to spread non-iterable instance')
}

function _nonIterableRest() {
  throw new TypeError('Invalid attempt to destructure non-iterable instance')
}

var isStateObject = function isStateObject(x) {
  return x !== null && _typeof(x) === 'object' && !Array.isArray(x)
}

var effectSymbol = '__effect__'
var selectSymbol = '__select__'
var selectDependenciesSymbol = '__selectDependencies__'
var selectStateSymbol = '__selectState__'
var reducerSymbol = '__reducer__'

var get = function get(path, target) {
  return path.reduce(function(acc, cur) {
    return isStateObject(acc) ? acc[cur] : undefined
  }, target)
}

var set$1 = function set(path, target, value) {
  path.reduce(function(acc, cur, idx) {
    if (idx + 1 === path.length) {
      acc[cur] = value
    } else {
      acc[cur] = acc[cur] || {}
    }

    return acc[cur]
  }, target)
}

var tick = function tick() {
  return new Promise(function(resolve) {
    return setTimeout(resolve)
  })
}

var startsWith = function startsWith(target, search) {
  return target.substr(0, search.length) === search
}

var effect = function effect(fn) {
  // eslint-disable-next-line no-param-reassign
  fn[effectSymbol] = true
  return fn
}
var select = function select(fn, dependencies) {
  var selector = memoizeOne(function(state) {
    return fn(state)
  })
  selector[selectSymbol] = true
  selector[selectDependenciesSymbol] = dependencies
  selector[selectStateSymbol] = {}
  return selector
}
var reducer = function reducer(fn) {
  // eslint-disable-next-line no-param-reassign
  fn[reducerSymbol] = true
  return fn
}
var createStore = function createStore(model) {
  var options =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {}
  var _options$devTools = options.devTools,
    devTools = _options$devTools === void 0 ? true : _options$devTools,
    _options$middleware = options.middleware,
    middleware = _options$middleware === void 0 ? [] : _options$middleware,
    _options$initialState = options.initialState,
    initialState =
      _options$initialState === void 0 ? {} : _options$initialState,
    injections = options.injections,
    compose = options.compose,
    _options$reducerEnhan = options.reducerEnhancer,
    reducerEnhancer =
      _options$reducerEnhan === void 0
        ? function(reducer) {
            return reducer
          }
        : _options$reducerEnhan

  var definition = _objectSpread({}, model, {
    logFullState: function logFullState(state) {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(state, null, 2))
    },
  })

  var references = {}
  var defaultState = {}
  var actionEffects = {}
  var actionCreators = {}
  var actionReducers = {}
  var customReducers = []
  var selectorReducers = []

  var extract = function extract(current, parentPath) {
    return Object.keys(current).forEach(function(key) {
      var value = current[key]

      var path = _toConsumableArray(parentPath).concat([key])

      if (typeof value === 'function') {
        if (value[selectSymbol]) {
          // skip
          value[selectStateSymbol] = {
            parentPath: parentPath,
            key: key,
            executed: false,
          }
          selectorReducers.push(value)
        } else if (value[effectSymbol]) {
          // Effect Action
          var actionName = '@effect.'.concat(path.join('.'))

          var action = function action(payload) {
            if (devTools) {
              references.dispatch({
                type: actionName,
                payload: payload,
              })
            }

            return value(
              references.dispatch,
              payload,
              references.getState,
              injections,
            )
          }

          action.actionName = actionName
          set$1(path, actionEffects, action) // Effect Action Creator

          set$1(path, actionCreators, function(payload) {
            return tick().then(function() {
              return references.dispatch(function() {
                return action(payload)
              })
            })
          })
        } else if (value[reducerSymbol]) {
          customReducers.push({
            path: path,
            reducer: value,
          })
        } else {
          // Reducer Action
          var _actionName = '@action.'.concat(path.join('.'))

          var _action = function _action(state, payload) {
            return produce(state, function(draft) {
              return value(draft, payload, {
                dispatch: references.dispatch,
                dispatchLocal: get(path, references.dispatch),
                getState: references.getState,
              })
            })
          }

          _action.actionName = _actionName
          set$1(path, actionReducers, _action) // Reducer Action Creator

          set$1(path, actionCreators, function(payload) {
            return references.dispatch({
              type: _action.actionName,
              payload: payload,
            })
          })
        }
      } else if (isStateObject(value) && Object.keys(value).length > 0) {
        extract(value, path)
      } else {
        // State
        var initialParentRef = get(parentPath, initialState)

        if (initialParentRef && key in initialParentRef) {
          set$1(path, defaultState, initialParentRef[key])
        } else {
          set$1(path, defaultState, value)
        }
      }
    })
  }

  extract(definition, [])

  var createReducers = function createReducers() {
    var createActionsReducer = function createActionsReducer(current, path) {
      var actionReducersAtPath = Object.keys(current).reduce(function(
        acc,
        key,
      ) {
        var value = current[key]

        if (typeof value === 'function' && !value[effectSymbol]) {
          return _toConsumableArray(acc).concat([value])
        }

        return acc
      },
      [])
      var stateAtPath = Object.keys(current).reduce(function(acc, key) {
        return isStateObject(current[key])
          ? _toConsumableArray(acc).concat([key])
          : acc
      }, [])
      var nestedReducers = stateAtPath.map(function(key) {
        return [
          key,
          createActionsReducer(
            current[key],
            _toConsumableArray(path).concat([key]),
          ),
        ]
      })
      return function() {
        var state =
          arguments.length > 0 && arguments[0] !== undefined
            ? arguments[0]
            : get(path, defaultState)
        var action = arguments.length > 1 ? arguments[1] : undefined

        // short circuit effects as they are noop in reducers
        if (startsWith(action.type, '@effect.')) {
          return state
        } // short circuit actions if they aren't a match on current path

        if (
          path.length > 0 &&
          !startsWith(action.type, '@action.'.concat(path.join('.')))
        ) {
          return state
        }

        var actionReducer = actionReducersAtPath.find(function(x) {
          return x.actionName === action.type
        })

        if (actionReducer) {
          return actionReducer(state, action.payload)
        }

        for (var i = 0; i < nestedReducers.length; i += 1) {
          var _nestedReducers$i = _slicedToArray(nestedReducers[i], 2),
            key = _nestedReducers$i[0],
            red = _nestedReducers$i[1]

          var newState = red(state[key], action)

          if (state[key] !== newState) {
            return _objectSpread({}, state, _defineProperty({}, key, newState))
          }
        }

        return state
      }
    }

    var reducerForActions = createActionsReducer(actionReducers, [])
    var reducerWithCustom =
      customReducers.length > 0
        ? function(state, action) {
            var stateAfterActions = reducerForActions(state, action)
            return produce(stateAfterActions, function(draft) {
              customReducers.forEach(function(_ref) {
                var p = _ref.path,
                  red = _ref.reducer
                var current = get(p, draft)
                set$1(p, draft, red(current, action))
              })
            })
          }
        : reducerForActions

    var runSelectorReducer = function runSelectorReducer(state, selector) {
      var _selector$selectState = selector[selectStateSymbol],
        parentPath = _selector$selectState.parentPath,
        key = _selector$selectState.key,
        executed = _selector$selectState.executed

      if (executed) {
        return state
      }

      var dependencies = selector[selectDependenciesSymbol]
      var newState = produce(
        dependencies ? dependencies.reduce(runSelectorReducer, state) : state,
        function(draft) {
          // eslint-disable-next-line no-param-reassign
          var target = parentPath.length > 0 ? get(parentPath, draft) : draft

          if (target) {
            target[key] = selector(target)
          }
        },
      ) // eslint-disable-next-line no-param-reassign

      selector[selectStateSymbol].executed = true
      return newState
    }

    var runSelectors = function runSelectors(state) {
      return selectorReducers.reduce(runSelectorReducer, state)
    }

    var isInitial = true
    return selectorReducers.length > 0
      ? function(state, action) {
          var stateAfterActions = reducerWithCustom(state, action)

          if (state !== stateAfterActions || isInitial) {
            var stateAfterSelectors = runSelectors(stateAfterActions)
            isInitial = false
            selectorReducers.forEach(function(selector) {
              // eslint-disable-next-line no-param-reassign
              selector[selectStateSymbol].executed = false
            })
            return stateAfterSelectors
          }

          return stateAfterActions
        }
      : reducerWithCustom
  }

  var reducers = createReducers()
  var composeEnhancers =
    compose ||
    (devTools &&
    typeof window !== 'undefined' &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
      ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
      : redux.compose)
  var store = redux.createStore(
    reducerEnhancer(reducers),
    defaultState,
    composeEnhancers(
      redux.applyMiddleware.apply(
        void 0,
        [thunk].concat(_toConsumableArray(middleware)),
      ),
    ),
  ) // attach the action creators to dispatch

  Object.keys(actionCreators).forEach(function(key) {
    store.dispatch[key] = actionCreators[key]
  })
  references.dispatch = store.dispatch
  references.getState = store.getState
  references.getState.getState = store.getState
  return store
}

var StoreContext = React.createContext()

function useStore(mapState) {
  var dependencies =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : []
  var store = React.useContext(StoreContext)

  var _useState = React.useState(mapState(store.getState())),
    _useState2 = _slicedToArray(_useState, 2),
    state = _useState2[0],
    setState = _useState2[1] // As our effect only fires on mount and unmount it won't have the state
  // changes visible to it, therefore we use a mutable ref to track this.

  var stateRef = React.useRef(state) // Helps avoid firing of events when unsubscribed, i.e. unmounted

  var isActive = React.useRef(true)
  React.useEffect(function() {
    var calculateState = function calculateState() {
      var newState = mapState(store.getState())
      isActive.current = true

      if (
        newState === stateRef.current ||
        (isStateObject(newState) &&
          isStateObject(stateRef.current) &&
          shallowEqual(newState, stateRef.current))
      ) {
        // Do nothing
        return
      }

      stateRef.current = newState // The settimeout wrap fixes a strange issue where a setState would
      // fire but the associated hook wouldn't receive it. It's almost as
      // if the effect was handled in a synchronous manner in some part of
      // the React reconciliation process that ended up with it not
      // propagating

      setTimeout(function() {
        if (isActive.current) {
          setState(newState)
        }
      })
    }

    calculateState()
    var unsubscribe = store.subscribe(calculateState)
    return function() {
      unsubscribe()
      isActive.current = false
    }
  }, dependencies)
  return state
}
function useAction(mapActions) {
  var store = React.useContext(StoreContext)
  return mapActions(store.dispatch)
}

var StoreProvider = function StoreProvider(_ref) {
  var children = _ref.children,
    store = _ref.store
  return React__default.createElement(
    StoreContext.Provider,
    {
      value: store,
    },
    children,
  )
}

exports.createStore = createStore
exports.effect = effect
exports.reducer = reducer
exports.select = select
exports.StoreProvider = StoreProvider
exports.StoreContext = StoreContext
exports.useAction = useAction
exports.useStore = useStore
//# sourceMappingURL=easy-peasy.cjs.js.map
