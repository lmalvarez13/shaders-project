// Vertex Shader
var meshVS = `
	attribute vec3 pos;
	attribute vec3 normal;
	attribute vec2 vTexCoord;

	uniform mat4 mvp;
	uniform mat4 mv;
	uniform int swap;
	
	varying vec2 texCoord;
	varying vec3 normCoord;
	varying vec3 vertCoord;
	varying vec3 varPos;
	
	void main()
	{ 
		if(swap == 1){ gl_Position = mvp * vec4(pos.x, pos.z, pos.y, 1); }
		else if(swap == 0){ gl_Position = mvp * vec4(pos, 1);}

		varPos = pos;
		normCoord = normal;
		texCoord = vTexCoord;
		vertCoord = normalize((mv * vec4(pos, 1)).xyz) ;
	}
`;