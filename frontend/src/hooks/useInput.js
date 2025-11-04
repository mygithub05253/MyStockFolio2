import { useState } from "react";

const useInput = (initialValue) => {  
  
  const [value, setValue] = useState(initialValue);
  const onChangeValue = (e) => {
    setValue(e.target.value);
  }
  
  return [value, onChangeValue, setValue];
};

export default useInput;