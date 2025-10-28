// Fragment Shader
// Algunas funciones útiles para escribir este shader:
// Dot product: https://thebookofshaders.com/glossary/?search=dot
// Normalize:   https://thebookofshaders.com/glossary/?search=normalize
// Pow:         https://thebookofshaders.com/glossary/?search=pow

// Shaping functions: https://thebookofshaders.com/05/

var meshFS = `
	#extension GL_OES_standard_derivatives : enable
	precision mediump float;

	uniform mat3 mn;
	uniform sampler2D texGPU;
	uniform int drawTexture;
	uniform vec3 lightDir;
	uniform float alpha;
    uniform float effect;

	varying vec2 texCoord;
	varying vec3 normCoord;
	varying vec3 vertCoord;
	varying vec3 varPos;


	void main()
	{
		vec4 kd;

		if (drawTexture == 0) { kd = vec4(1);}
		else if (drawTexture == 1) { kd = texture2D(texGPU, texCoord);}

		vec4 ks = vec4(1);
		vec4 intensidad = vec4(1);
		vec3 l = lightDir;
		vec3 v = normalize(vertCoord);
		vec3 n = normalize(mn * normCoord);
		vec3 h = normalize(lightDir - v);

		float cos_theta = dot(n, lightDir);
		float cos_omega = dot(n, h);


		gl_FragColor = intensidad * max(0.0, cos_theta) * (kd + (ks * pow(max(0.0, cos_omega), alpha) / cos_theta));
		gl_FragColor.w = 1.0;
	}
`;

var meshToonFS = `
	#extension GL_OES_standard_derivatives : enable
	precision mediump float;

	uniform mat3 mn;
	uniform sampler2D texGPU;
	uniform int drawTexture;
	uniform vec3 lightDir;
	uniform float alpha;
    uniform float effect;
	uniform float timer;

	varying vec2 texCoord;
	varying vec3 normCoord;
	varying vec3 vertCoord;
	varying vec3 varPos;


	void main()
	{
		vec4 kd;

		if (drawTexture == 0) { kd = vec4(1);}
		else if (drawTexture == 1) { kd = texture2D(texGPU, texCoord);}

		vec4 ks = vec4(1);
		vec4 intensidad = vec4(1);
		vec3 l = lightDir;
		vec3 v = normalize(vertCoord);
		vec3 n = normalize(mn * normCoord);
		vec3 h = normalize(lightDir - v);

		float cos_theta = dot(n, lightDir);
		float cos_omega = dot(n, h);

		// Calculamos el factor difuso de la luz.
		float df = cos_theta;

		// Definimos los pasos
		float nSteps = effect;
		float step = df * nSteps;
		step = (floor(step) + smoothstep(0.48, 0.52, fract(step))) / nSteps;

		float surface_color = step * step;
		gl_FragColor = vec4(vec3(surface_color), 1.0) * intensidad * max(0.0, cos_theta) * kd;
	}
`;

var meshCosineFS = `
	#extension GL_OES_standard_derivatives : enable
	precision mediump float;

	uniform mat3 mn;
	uniform sampler2D texGPU;
	uniform int drawTexture;
	uniform vec3 lightDir;
	uniform float alpha;
    uniform float effect;
	uniform float timer;

	varying vec2 texCoord;
	varying vec3 normCoord;
	varying vec3 vertCoord;
	varying vec3 varPos;


	void main()
	{
		vec4 kd;

		if (drawTexture == 0) { kd = vec4(1);}
		else if (drawTexture == 1) { kd = texture2D(texGPU, texCoord);}

		vec4 ks = vec4(1);
		vec4 intensidad = vec4(1);
		vec3 l = lightDir;
		vec3 v = normalize(vertCoord);
		vec3 n = normalize(mn * normCoord);
		vec3 h = normalize(lightDir - v);

		float cos_theta = dot(n, lightDir);
		float cos_omega = dot(n, h);

		float EffectSpeed = 5.0;
		vec3 surface_color = vec3(0.5 + 0.5 * cos(effect * 10.0 * varPos.y + EffectSpeed * timer));
		float df = cos_theta;

		surface_color *= max(0.0, df);

		gl_FragColor = intensidad * max(0.0, cos_theta) * (kd + (ks * pow(max(0.0, cos_omega), alpha) / cos_theta)) * vec4(surface_color, 1.0);
	}
`;

var meshStripeFS = `
	#extension GL_OES_standard_derivatives : enable
	precision mediump float;

	uniform mat3 mn;
	uniform sampler2D texGPU;
	uniform int drawTexture;
	uniform vec3 lightDir;
	uniform float alpha;
    uniform float effect;
	uniform float timer;

	varying vec2 texCoord;
	varying vec3 normCoord;
	varying vec3 vertCoord;
	varying vec3 varPos;


	void main()
	{
		vec4 kd;

		if (drawTexture == 0) { kd = vec4(1);}
		else if (drawTexture == 1) { kd = texture2D(texGPU, texCoord);}

		vec4 ks = vec4(1);
		vec4 intensidad = vec4(1);
		vec3 l = lightDir;
		vec3 v = normalize(vertCoord);
		vec3 n = normalize(mn * normCoord);
		vec3 h = normalize(lightDir - v);

		float cos_theta = dot(n, lightDir);
		float cos_omega = dot(n, h);

		float df = cos_theta;

		float surface_color = max(0.0, df);

		float EffectSpeed = 5.0;
		if(cos(effect * 20.0 * varPos.y + EffectSpeed * timer) < 0.0){
			discard;
		}

		gl_FragColor = vec4(vec3(surface_color), 1.0) * intensidad * max(0.0, cos_theta) * (kd + (ks * pow(max(0.0, cos_omega), alpha) / cos_theta));
		gl_FragColor.w = 1.0;
	}
`;

var meshDotFS = `
	precision mediump float;

	uniform mat3 mn;
	uniform sampler2D texGPU;
	uniform int drawTexture;
	uniform vec3 lightDir;
	uniform float alpha;
    uniform float effect;
	uniform float timer;

	varying vec2 texCoord;
	varying vec3 normCoord;
	varying vec3 vertCoord;
	varying vec3 varPos;

	float circle(vec2 pixel, vec2 center, float radius) {
    	return 1.0 - smoothstep(radius - 1.0, radius + 1.0, length(pixel - center));
	}

	mat2 rotate(float angle) {
    	return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
	}

	void main()
	{
		vec4 kd;

		if (drawTexture == 0) { kd = vec4(1);}
		else if (drawTexture == 1) { kd = texture2D(texGPU, texCoord);}

		vec4 ks = vec4(1);
		vec4 intensidad = vec4(1);
		vec3 l = lightDir;
		vec3 v = normalize(vertCoord);
		vec3 n = normalize(mn * normCoord);
		vec3 h = normalize(lightDir - v);

		float cos_theta = dot(n, lightDir);
		float cos_omega = dot(n, h);

		vec2 elementPosition = gl_FragCoord.xy;
		elementPosition = rotate(radians(20.0)) * elementPosition;

		float df = cos_theta;

		df = max(0.0, df);

		float grid_step = max(effect, 0.5) * 2.0;
		vec2 grid_pos = mod(elementPosition, grid_step);

		float surface_color = 1.0;
		float radius = 0.8 * grid_step * pow(1.0 - df, 2.0);
		surface_color -= circle(grid_pos, vec2(grid_step / 2.0), radius);
		surface_color = clamp(surface_color, 0.05, 1.0);

		gl_FragColor = vec4(vec3(surface_color), 1.0) * kd;
	}
`;

var meshPencilFS = `
	precision mediump float;

	uniform mat3 mn;
	uniform sampler2D texGPU;
	uniform int drawTexture;
	uniform vec3 lightDir;
	uniform float alpha;
    uniform float effect;
	uniform float timer;

	varying vec2 texCoord;
	varying vec3 normCoord;
	varying vec3 vertCoord;
	varying vec3 varPos;

	float circle(vec2 pixel, vec2 center, float radius) {
    	return 1.0 - smoothstep(radius - 1.0, radius + 1.0, length(pixel - center));
	}

	mat2 rotate(float angle) {
    	return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
	}

	float horizontalLine(vec2 pixel, float y_pos, float width) {
	    return 1.0 - smoothstep(-1.0, 1.0, abs(pixel.y - y_pos) - 0.5 * width);
	}

	void main()
	{
		vec4 kd;

		if (drawTexture == 0) { kd = vec4(1);}
		else if (drawTexture == 1) { kd = texture2D(texGPU, texCoord);}

		vec4 ks = vec4(1);
		vec4 intensidad = vec4(1);
		vec3 l = lightDir;
		vec3 v = normalize(vertCoord);
		vec3 n = normalize(mn * normCoord);
		vec3 h = normalize(lightDir - v);

		float cos_theta = dot(n, lightDir);
		float cos_omega = dot(n, h);

		vec2 elementPosition = gl_FragCoord.xy;
		elementPosition = rotate(radians(20.0)) * elementPosition;

		float df = cos_theta;

		df = max(0.0, df);

		float line_width = 7.0 * (1.0 - smoothstep(0.0, 0.3, df)) + 0.5;
		float lines_sep = effect * 2.0;
		vec2 grid_pos = vec2(elementPosition.x, mod(elementPosition.y, lines_sep));
		float line_1 = horizontalLine(grid_pos, lines_sep / 2.0, line_width);
		grid_pos.y = mod(elementPosition.y + lines_sep / 2.0, lines_sep);
		float line_2 = horizontalLine(grid_pos, lines_sep / 2.0, line_width);

		elementPosition = rotate(radians(-50.0)) * elementPosition;

		lines_sep -= 5.0;
		grid_pos = vec2(elementPosition.x, mod(elementPosition.y, lines_sep));
	    float line_3 = horizontalLine(grid_pos, lines_sep / 2.0, line_width);
	    grid_pos.y = mod(elementPosition.y + lines_sep / 2.0, lines_sep);
	    float line_4 = horizontalLine(grid_pos, lines_sep / 2.0, line_width);


	    float surface_color = 1.0;
	    surface_color -= 0.8 * line_1 * (1.0 - smoothstep(0.5, 0.75, df));
	    surface_color -= 0.8 * line_2 * (1.0 - smoothstep(0.4, 0.5, df));
	    surface_color -= 0.8 * line_3 * (1.0 - smoothstep(0.4, 0.65, df));
	    surface_color -= 0.8 * line_4 * (1.0 - smoothstep(0.2, 0.4, df));
	    surface_color = clamp(surface_color, 0.05, 1.0);

		gl_FragColor = vec4(vec3(surface_color), 1.0) * kd;
	}
`;
