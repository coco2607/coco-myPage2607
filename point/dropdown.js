// dropdown.js

// ===========================
// 커스텀 드롭다운 생성
// ===========================
export function createDropdown(options) {

    const {
        items = [],
        placeholder = "내용",
        onSelect = null
    } = options;

    // 전체 박스
    const wrapper = document.createElement("div");
    wrapper.className = "dropdown";

    // 입력창
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    input.className = "dropdownInput";

    // 목록
    const list = document.createElement("div");
    list.className = "dropdownList";

    wrapper.appendChild(input);
    wrapper.appendChild(list);

    // 목록 생성
    renderList("");

    // -----------------------
    // 목록 다시 그림
    // -----------------------
    function renderList() {

        list.innerHTML = "";

        items.forEach(item => {

            const div = document.createElement("div");
            div.className = "dropdownItem";
            div.textContent = item;

            div.addEventListener("click", () => {

                input.value = item;
                list.classList.remove("show");

                if (onSelect) {
                    onSelect(item);
                }

            });

            list.appendChild(div);

        });

    }

    // -----------------------
    // 입력
    // -----------------------
    input.addEventListener("input", () => {

        renderList(input.value);

        list.classList.add("show");

    });

    // -----------------------
    // 클릭
    // -----------------------
    input.addEventListener("click", () => {

        renderList(input.value);

        list.classList.add("show");

    });

    // -----------------------
    // 포커스
    // -----------------------
    input.addEventListener("focus", () => {

        renderList(input.value);

        list.classList.add("show");

    });

    // -----------------------
    // 바깥 클릭
    // -----------------------
    document.addEventListener("click", e => {

        if (!wrapper.contains(e.target)) {
            list.classList.remove("show");
        }

    });

    return {
        element: wrapper,

        get value() {
            return input.value.trim();
        },

        set value(v) {
            input.value = v;
        },

        focus() {
            input.focus();
        }
    };
}