let ol: any = null;

function updateOl(data: any) {
  ol = {
    ...ol,
    ...data
  }
}

export {
  ol,
  updateOl
}