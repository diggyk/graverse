//!!! WARNING!!!! HACKY CLOWNTOWN STUFF BELOW!!!!!!!!

// We got an "Object" property value. Do our best to see if it is a map or array
export const convertPropVal = (val: Object): any => {
  let tempMapStr = JSON.stringify(val);
  let tempJson = JSON.parse(tempMapStr);
  let tempMap = new Map(Object.entries(tempJson));

  let areNumericalIndexKeys = true;
  let index = 0;
  tempMap.forEach((_: any, k: string) => {
    console.log(k);
    if (k != String(index)) {
      areNumericalIndexKeys = false;
    }
    index++;
  });

  console.log(areNumericalIndexKeys);
  if (!areNumericalIndexKeys) {
    return tempMapStr;
  } else {
    console.log("Numbers!");
    let arr: any[] = [];
    tempMap.forEach((v: any, _: string) => {
      arr.push(v);
    });
    return arr;
  }
};
