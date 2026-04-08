(function () {
  var toggle = document.querySelector(".nav-toggle");
  var panel = document.querySelector(".nav-panel");

  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      panel.classList.toggle("is-open", !open);
    });

    panel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        panel.classList.remove("is-open");
      });
    });
  }

  var form = document.querySelector("[data-contact-form]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = form.querySelector("[data-form-message]");
      if (msg) {
        msg.hidden = false;
      }
      form.reset();
    });
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initSilkBackground() {
    var canvas = document.querySelector("[data-silk-bg]");
    if (!canvas) return;

    var gl =
      canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false }) ||
      canvas.getContext("experimental-webgl");
    if (!gl) return;

    var vertSrc =
      "attribute vec2 aPosition;\\n" +
      "varying vec2 vUv;\\n" +
      "void main(){\\n" +
      "  vUv = aPosition * 0.5 + 0.5;\\n" +
      "  gl_Position = vec4(aPosition, 0.0, 1.0);\\n" +
      "}\\n";

    var fragSrc =
      "precision mediump float;\\n" +
      "varying vec2 vUv;\\n" +
      "uniform float uTime;\\n" +
      "uniform vec3 uColor;\\n" +
      "uniform float uSpeed;\\n" +
      "uniform float uScale;\\n" +
      "uniform float uRotation;\\n" +
      "uniform float uNoiseIntensity;\\n" +
      "const float e = 2.71828182845904523536;\\n" +
      "float noise(vec2 texCoord){\\n" +
      "  float G = e;\\n" +
      "  vec2 r = (G * sin(G * texCoord));\\n" +
      "  return fract(r.x * r.y * (1.0 + texCoord.x));\\n" +
      "}\\n" +
      "vec2 rotateUvs(vec2 uv, float angle){\\n" +
      "  float c = cos(angle);\\n" +
      "  float s = sin(angle);\\n" +
      "  mat2 rot = mat2(c, -s, s, c);\\n" +
      "  return rot * uv;\\n" +
      "}\\n" +
      "void main(){\\n" +
      "  float rnd = noise(gl_FragCoord.xy);\\n" +
      "  vec2 uv = rotateUvs(vUv * uScale, uRotation);\\n" +
      "  vec2 tex = uv * uScale;\\n" +
      "  float tOffset = uSpeed * uTime;\\n" +
      "  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);\\n" +
      "  float pattern = 0.6 + 0.4 * sin(5.0 * (tex.x + tex.y + cos(3.0 * tex.x + 5.0 * tex.y) + 0.02 * tOffset) + sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));\\n" +
      "  vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;\\n" +
      "  col.a = 1.0;\\n" +
      "  gl_FragColor = col;\\n" +
      "}\\n";

    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    }

    var vs = compile(gl.VERTEX_SHADER, vertSrc);
    var fs = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return;

    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    var aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    var uTime = gl.getUniformLocation(program, "uTime");
    var uColor = gl.getUniformLocation(program, "uColor");
    var uSpeed = gl.getUniformLocation(program, "uSpeed");
    var uScale = gl.getUniformLocation(program, "uScale");
    var uRotation = gl.getUniformLocation(program, "uRotation");
    var uNoiseIntensity = gl.getUniformLocation(program, "uNoiseIntensity");

    // Adapted to our palette: warm taupe-beige silk
    gl.uniform3f(uColor, 0.54, 0.46, 0.40); // ~ #8A7667
    gl.uniform1f(uSpeed, 3.6);
    gl.uniform1f(uScale, 1.15);
    gl.uniform1f(uRotation, 0.08);
    gl.uniform1f(uNoiseIntensity, 1.15);

    function resize() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var w = Math.floor(window.innerWidth * dpr);
      var h = Math.floor(window.innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        gl.viewport(0, 0, w, h);
      }
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });

    var start = performance.now();
    function frame(now) {
      resize();
      var t = (now - start) / 1000;
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!reduceMotion) requestAnimationFrame(frame);
    }

    // If reduced motion: draw one static frame
    requestAnimationFrame(frame);
  }

  initSilkBackground();

  function splitChars(root, opts) {
    if (!root) return;
    if (root.getAttribute("data-split-done") === "true") return;

    var stagger = (opts && opts.staggerMs) || 18;
    root.style.setProperty("--stagger", stagger + "ms");
    root.classList.add("split-parent");

    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    var globalIndex = 0;
    textNodes.forEach(function (node) {
      var value = node.nodeValue || "";
      var frag = document.createDocumentFragment();

      for (var i = 0; i < value.length; i++) {
        var ch = value[i];
        if (ch === " ") {
          frag.appendChild(document.createTextNode("\u00A0"));
          continue;
        }
        var span = document.createElement("span");
        span.className = "split-char";
        span.style.setProperty("--i", String(globalIndex++));
        span.textContent = ch;
        frag.appendChild(span);
      }

      node.parentNode.replaceChild(frag, node);
    });

    root.setAttribute("data-split-done", "true");
  }

  function runHeroSplit() {
    var els = document.querySelectorAll("[data-split=\"chars\"]");
    els.forEach(function (el) {
      var isTitle = el.classList.contains("hero__title");
      splitChars(el, { staggerMs: isTitle ? 14 : 18 });
    });

    requestAnimationFrame(function () {
      els.forEach(function (el) {
        el.classList.add("is-split-in");
      });
    });
  }

  if (!reduceMotion) {
    if (document.fonts && document.fonts.status !== "loaded") {
      document.fonts.ready.then(runHeroSplit).catch(runHeroSplit);
    } else {
      runHeroSplit();
    }
  } else {
    document.querySelectorAll("[data-split=\"chars\"]").forEach(function (el) {
      el.classList.add("is-split-in");
    });
  }

  function initTestimonials() {
    var root = document.querySelector("[data-testimonials]");
    if (!root) return;

    var cards = Array.prototype.slice.call(root.querySelectorAll("[data-testimonial]"));
    if (!cards.length) return;

    var dotsRoot = root.querySelector("[data-testimonials-dots]");
    var prevBtn = root.querySelector("[data-testimonials-prev]");
    var nextBtn = root.querySelector("[data-testimonials-next]");

    var active = 0;
    var timer = null;

    function setActive(idx) {
      active = (idx + cards.length) % cards.length;
      cards.forEach(function (card, i) {
        card.classList.toggle("is-active", i === active);
        card.setAttribute("aria-hidden", i === active ? "false" : "true");
      });
      if (dotsRoot) {
        Array.prototype.slice.call(dotsRoot.querySelectorAll("button")).forEach(function (b, i) {
          b.setAttribute("aria-current", i === active ? "true" : "false");
        });
      }
    }

    function buildDots() {
      if (!dotsRoot) return;
      dotsRoot.innerHTML = "";
      cards.forEach(function (_, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "testimonials__dot";
        b.setAttribute("aria-label", "Перейти к отзыву " + (i + 1));
        b.addEventListener("click", function () {
          stop();
          setActive(i);
          start();
        });
        dotsRoot.appendChild(b);
      });
    }

    function start() {
      if (reduceMotion) return;
      if (cards.length <= 1) return;
      stop();
      timer = window.setInterval(function () {
        setActive(active + 1);
      }, 6500);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    buildDots();
    setActive(0);
    start();

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        stop();
        setActive(active - 1);
        start();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        stop();
        setActive(active + 1);
        start();
      });
    }

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });
  }

  initTestimonials();

  if (!reduceMotion && "IntersectionObserver" in window) {
    document.querySelectorAll("main > section:not(.hero)").forEach(function (el) {
      el.classList.add("js-reveal");

      var items = el.querySelectorAll(
        ".card, .service-card, .cta-band, .form, .about-photo, .site-footer__grid > *, .about-grid > *, .trust-item, .testimonials__nav"
      );
      items.forEach(function (item, idx) {
        item.classList.add("reveal-item");
        item.style.setProperty("--i", String(idx));
      });
    });
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-inview");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    document.querySelectorAll(".js-reveal").forEach(function (el) {
      observer.observe(el);
    });
  } else {
    document.querySelectorAll("main > section:not(.hero)").forEach(function (el) {
      el.classList.add("is-inview");
    });
  }
})();
