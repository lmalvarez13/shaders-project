// <============================================ ACLARACIONES ============================================>
//
//      * Utilizaremos una sola fuente de luz direccional en toda la escena
//      * La intensidad I para el modelo de iluminación debe ser seteada como blanca (1.0,1.0,1.0,1.0) en RGB
//      * Es opcional incorporar la componente ambiental (Ka) del modelo de iluminación
//      * Los coeficientes Kd y Ks correspondientes a las componentes difusa y especular del modelo
//        deben ser seteados con el color blanco. En caso de que se active el uso de texturas, la
//        componente difusa (Kd) será reemplazada por el valor de textura.
//
// <=====================================================================================================>

// Esta función recibe la matriz de proyección (ya calculada), una
// traslación y dos ángulos de rotación (en radianes). Cada una de
// las rotaciones se aplican sobre el eje x e y, respectivamente.
// La función retorna la combinación de las transformaciones
// 3D (rotación, traslación y proyección) en una matriz de 4x4,
// representada por un arreglo en formato column-major.

function GetModelViewMatrix(
  translationX,
  translationY,
  translationZ,
  rotationX,
  rotationY
) {

  var rotationMatrixX = [
    1,
    0,
    0,
    0,
    0,
    Math.cos(rotationX),
    Math.sin(rotationX),
    0,
    0,
    -Math.sin(rotationX),
    Math.cos(rotationX),
    0,
    0,
    0,
    0,
    1,
  ];

  var rotationMatrixY = [
    Math.cos(rotationY),
    0,
    -Math.sin(rotationY),
    0,
    0,
    1,
    0,
    0,
    Math.sin(rotationY),
    0,
    Math.cos(rotationY),
    0,
    0,
    0,
    0,
    1,
  ];

  // Matriz de traslación
  var trans = [
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    translationX,
    translationY,
    translationZ,
    1,
  ];

  var mv = trans;
  mv = MatrixMult(mv, rotationMatrixX);
  mv = MatrixMult(mv, rotationMatrixY);
  return mv;
}

class MeshDrawer {
  // El constructor es donde nos encargamos de realizar las inicializaciones necesarias.
  constructor(selectedShader) {

    // 1. Compilamos el programa de shaders
    var fragmentShader = this.selectShader(selectedShader);

    this.prog = InitShaderProgram(meshVS, fragmentShader);
    // 2. Obtenemos los IDs de las variables uniformes en los shaders
    this.mvp = gl.getUniformLocation(this.prog, "mvp");
    this.mv = gl.getUniformLocation(this.prog, "mv");
    this.mn = gl.getUniformLocation(this.prog, "mn");
    this.sampler = gl.getUniformLocation(this.prog, "texGPU");
    this.swap = gl.getUniformLocation(this.prog, "swap");
    this.drawTexture = gl.getUniformLocation(this.prog, "drawTexture");
    this.lightDir = gl.getUniformLocation(this.prog, "lightDir");
    this.alpha = gl.getUniformLocation(this.prog, "alpha");
    this.effect = gl.getUniformLocation(this.prog, "effect");
    this.timer = gl.getUniformLocation(this.prog, "timer");
    // 3. Obtenemos los IDs de los atributos de los vértices en los shaders
    this.pos = gl.getAttribLocation(this.prog, "pos");
    this.normal = gl.getAttribLocation(this.prog, "normal");
    this.textureCoord = gl.getAttribLocation(this.prog, "vTexCoord");
    // ...
    this.vertexBuffer = gl.createBuffer();
    this.texture = gl.createTexture();
    this.textureBuffer = gl.createBuffer();
    this.normalBuffer = gl.createBuffer();
  }

  selectShader(selectedShader) {
    var useShader = meshFS;

    switch (selectedShader) {
      case "phone":
        useShader = meshFS;
        break;
      case "toon":
        useShader = meshToonFS;
        break;
      case "cosine":
        useShader = meshCosineFS;
        break;
      case "stripe":
        useShader = meshStripeFS;
        break;
      case "dot":
        useShader = meshDotFS;
        break;
      case "pencil":
        useShader = meshPencilFS;
        break;
    }

    return useShader;
  }

  // Esta función se llama cada vez que el usuario carga un nuevo
  // archivo OBJ. En los argumentos de esta función llegan un areglo
  // con las posiciones 3D de los vértices, un arreglo 2D con las
  // coordenadas de textura y las normales correspondientes a cada
  // vértice. Todos los items en estos arreglos son del tipo float.
  // Los vértices y normales se componen de a tres elementos
  // consecutivos en el arreglo vertPos [x0,y0,z0,x1,y1,z1,..] y
  // normals [n0,n0,n0,n1,n1,n1,...]. De manera similar, las
  // cooredenadas de textura se componen de a 2 elementos
  // consecutivos y se  asocian a cada vértice en orden.
  setMesh(vertPos, texCoords, normals) {
    this.numTriangles = vertPos.length / 3 / 3;

    // 1. Binding y seteo del buffer de vértices
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
    // 2. Binding y seteo del buffer de coordenadas de textura
    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
    // 3. Binding y seteo del buffer de normales
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  }

  // Esta función se llama cada vez que el usuario cambia el estado del checkbox 'Intercambiar Y-Z'
  // El argumento es un boleano que indica si el checkbox está tildado
  swapYZ(swap) {
    gl.useProgram(this.prog);
    if (swap) gl.uniform1i(this.swap, 1);
    else gl.uniform1i(this.swap, 0);
  }

  // Esta función se llama para dibujar la malla de triángulos
  //    La función draw recibe ahora 3 matrices en column-major:
  // El argumento es la matriz model-view-projection (matrixMVP),
  // la matriz model-view (matrixMV) que es retornada por
  // GetModelViewProjection y la matriz de transformación de las
  // normales (matrixNormal) que es la inversa transpuesta de matrixMV
  draw(matrixMVP, matrixMV, matrixNormal) {

    // 1. Seleccionamos el shader
    gl.useProgram(this.prog);

    // 2. Setear uniformes con las matrices de transformaciones
    gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
    gl.uniformMatrix4fv(this.mv, false, matrixMV);
    gl.uniformMatrix3fv(this.mn, false, matrixNormal);

    // 3. Habilitar atributos: vértices, normales, texturas
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
    gl.vertexAttribPointer(this.pos, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.pos);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);
    gl.vertexAttribPointer(this.textureCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.textureCoord);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
    gl.vertexAttribPointer(this.normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.normal);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.sampler, 0);

    gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles * 3);
  }

  // Esta función se llama para setear una textura sobre la malla
  // El argumento es un componente <img> de html que contiene la textura.
  setTexture(img) {
    gl.useProgram(this.prog);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    // Pueden setear la textura utilizando esta función:
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

    gl.generateMipmap(gl.TEXTURE_2D);
  }

  // Esta función se llama cada vez que el usuario cambia el estado del checkbox 'Mostrar textura'
  // El argumento es un boleano que indica si el checkbox está tildado
  showTexture(show) {
    gl.useProgram(this.prog);

    if (show) gl.uniform1i(this.drawTexture, 1);
    else gl.uniform1i(this.drawTexture, 0);
  }

  // Este método se llama al actualizar la dirección de la luz desde la interfaz
  setLightDir(x, y, z) {
    const light_len = Math.sqrt(x * x + y * y + z * z);
    gl.useProgram(this.prog);
    gl.uniform3f(this.lightDir, x / light_len, y / light_len, z / light_len);
  }

  // Este método se llama al actualizar el brillo del material
  setShininess(shininess) {
    gl.useProgram(this.prog);
    gl.uniform1f(this.alpha, shininess);
  }

  setEffect(effect) {
    gl.useProgram(this.prog);
    gl.uniform1f(this.effect, effect);
  }

  setTimer(timer) {
    gl.useProgram(this.prog);
    gl.uniform1f(this.timer, timer);
  }
}
