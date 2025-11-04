import { legacy_createStore as createStore } from 'redux';
import rootReducer from './modules'; // rootReducer import

// Redux 스토어 생성 및 export
const store = createStore(
    rootReducer,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__() // 개발자 도구 사용
);

export default store;