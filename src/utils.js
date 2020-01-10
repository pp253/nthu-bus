
/**
 * Input Dataframe
 *   {0: {x:1, y:2, z:3}}
 * Output Dataframe
 *   {x:[1], y:[2], z:[3]}
 */
export function transpose(dataframe) {
  let transposedDF = {}
  for (let row in dataframe) {
    for (let col in dataframe[row]) {
      if (!(col in transposedDF)) {
        transposedDF[col] = []
      }
      transposedDF[col].push(dataframe[row][col])
    }
  }
  return transposedDF
}
