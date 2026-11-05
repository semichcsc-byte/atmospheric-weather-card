export async function checkBrowser() {
    await import('../atmospheric-weather-card.js');
    const Card = customElements.get('atmospheric-weather-card');
    const card = Object.create(Card.prototype);
    const payload = `&<img src=x onerror="this.dataset.injected='yes'">'`;
    const hass = { states: { 'sensor.text': { state: payload, attributes: { unit_of_measurement: payload } } } };
    const ensure = (condition, message) => { if (!condition) throw new Error(message); };
    let domCases = 0;
    for (const fancy_unit of [false, true]) {
        for (const marquee of [false, true]) {
            for (const position of ['bottom-left', 'custom']) {
                const overflow = marquee ? 'marquee' : 'ellipsis';
                const { html } = card._renderButton({
                    entity: 'sensor.text', name_sensor: 'sensor.text', sub_value_entity: 'sensor.text',
                    fancy_unit, hide_icon: true, position, overflow,
                    label_overflow: overflow, sub_value_overflow: overflow,
                }, 0, hass, 'rainy', 'en', false, 'theme', 'stacked', 0, {});
                const host = document.createElement('div');
                host.innerHTML = html;
                ensure(!host.querySelector('img,script,iframe'), 'entity data created a DOM element');
                ensure(host.querySelector('.button-name').textContent === `${payload} ${payload}`, 'label text changed');
                const value = fancy_unit ? `${payload}${payload}` : `${payload} ${payload}`;
                ensure(host.querySelector('.button-val').textContent === value, 'value text changed');
                ensure(host.querySelector('.button-sub').textContent === value, 'sub-value text changed');
                domCases++;
            }
        }
    }
    const attack = `"><img src=x onerror="alert(1)">`;
    for (const type of ['default', 'ring', 'bar']) {
        const { html } = card._renderButton({
            entity: 'sensor.text', type, icon: attack, width: attack, height: attack,
            align: attack, padding: attack, overflow: attack, background_color: attack,
            ring_color: attack, bar_color: attack,
        }, 0, hass, 'rainy', 'en', false, 'theme', 'stacked', 0, {});
        const host = document.createElement('div');
        host.innerHTML = html;
        ensure(!host.querySelector('img,script,iframe,[onerror]'), 'attribute breakout');
        domCases++;
    }

    document.body.replaceChildren();
    document.body.style.cssText = 'background:#101820;color:white;font:16px sans-serif;display:flex;flex-wrap:wrap;gap:16px;padding:24px';
    const shaderCases = [];
    for (const [width, height, dark] of [[420, 220, 0], [420, 220, 1], [280, 180, 0], [900, 300, 1]]) {
        const frame = document.createElement('div');
        const label = document.createElement('p');
        label.textContent = `Rain ${width} x ${height} ${dark ? 'night' : 'day'}`;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.style.maxWidth = '100%';
        frame.append(label, canvas);
        document.body.append(frame);
        const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });
        ensure(gl, 'WebGL2 unavailable');
        const compile = (type, source) => {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            ensure(gl.getShaderParameter(shader, gl.COMPILE_STATUS), gl.getShaderInfoLog(shader));
            return shader;
        };
        const built = card._buildProgram(gl, 'water',
            compile(gl.VERTEX_SHADER, card._glslVert()),
            compile(gl.FRAGMENT_SHADER, card._glslFragWater()));
        ensure(built, 'water program link failed');
        gl.useProgram(built.prog);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const location = gl.getAttribLocation(built.prog, 'a_pos');
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
        const u = built.uniforms;
        gl.uniform2f(u.u_resolution, width, height);
        gl.uniform1f(u.u_ref_height, 300);
        gl.uniform1f(u.u_dark, dark);
        const colors = dark
            ? [[.1, .2, .3], [.08, .12, .2], [.03, .04, .08], [.01, .02, .03]]
            : [[.84, .9, .94], [.65, .76, .84], [.37, .49, .61], [.22, .31, .43]];
        const skyUniforms = ['u_sky_top', 'u_sky_mid', 'u_sky_low', 'u_sky_base'];
        skyUniforms.forEach((name, i) => gl.uniform3fv(u[name], colors[i]));
        const draw = (intensity, time, speed = 1, lightning = 0) => {
            gl.uniform1f(u.u_rain_intensity, intensity);
            gl.uniform1f(u.u_time, time);
            gl.uniform1f(u.u_fx_speed, speed);
            gl.uniform1f(u.u_lightning, lightning);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            const pixels = new Uint8Array(width * height * 4);
            gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            ensure(gl.getError() === gl.NO_ERROR, 'WebGL draw error');
            return pixels;
        };
        const differences = (a, b) => a.reduce((count, value, i) => count + (value !== b[i] ? 1 : 0), 0);
        const dry = draw(0, 15);
        const light = draw(.2, 15);
        const rain = draw(1, 15);
        const wetDiff = differences(dry, rain);
        ensure(wetDiff > 100, 'rain has no visible effect');
        ensure(differences(dry, light) < wetDiff, 'intensity does not increase rain coverage');
        const speedDiff = differences(rain, draw(1, 15, 0));
        ensure(speedDiff > 100, 'speed does not affect moving drops');
        let lightningVisible = false;
        for (let time = 0; time <= 30 && !lightningVisible; time += 0.5) {
            lightningVisible = differences(draw(1, time, 1, 0), draw(1, time, 1, 1)) > 100;
        }
        ensure(lightningVisible, 'lightning has no visible effect');
        // A flat sky isolates lens motion from the independently animated sky.
        skyUniforms.forEach(name => gl.uniform3f(u[name], .25, .35, .45));
        const motionDiff = differences(draw(1, 15), draw(1, 16));
        ensure(motionDiff > 100, 'drops do not move');
        ensure(differences(draw(1, 15, 0), draw(1, 16, 0)) === 0, 'zero speed does not freeze drops');
        ensure(differences(draw(0, 15), draw(0, 16)) === 0, 'zero intensity leaves moving drops');
        skyUniforms.forEach((name, i) => gl.uniform3fv(u[name], colors[i]));
        draw(1, 15);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(built.prog);
        shaderCases.push({ width, height, dark, wetDiff, speedDiff, motionDiff });
    }
    return { domCases, shaderCases };
}
