// root reducer 생성
import { combineReducers } from "redux";
import user from "./user";
import todo from "./todo";
import portfolio from './portfolio';
import dashboard from './dashboard';
import rewards from './rewards';

const rootReducer = combineReducers({
  user,
  todo,
  portfolio,
  dashboard,
  rewards
});

export default rootReducer;