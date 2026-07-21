// dropdown.js

// 커스텀 드롭다운 생성
export function createDropdown(options) {

    const {
        items = [],
        placeholder = "내용",
        onSelect = null,
        onInput = null
    } = options;


    // 래퍼
    const wrapper = document.createElement("div");
    wrapper.className = "dropdown";

    // 입력창
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    input.className = "dropdownInput";

    wrapper.appendChild(input);


    // 드롭다운 목록
    // body에 생성
    const list = document.createElement("div");
    list.className = "dropdownList";

    document.body.appendChild(list);


    // 목록 다시 그리기
    function renderList(keyword = "") {

        list.innerHTML = "";

        const text = keyword.trim().toLowerCase();

        items
            .filter(item => item.toLowerCase().includes(text))
            .forEach(item => {

                const div = document.createElement("div");
                div.className = "dropdownItem";
                div.textContent = item;

                div.addEventListener("click", () => {

                    input.value = item;

                    hideList();

                    if (onSelect) {
                        onSelect(item);
                    }

                });

                list.appendChild(div);
            });
    }


    // 목록 위치
    function positionList() {

        const rect = input.getBoundingClientRect();

        list.style.position = "fixed";
        list.style.left = rect.left + "px";
        list.style.top = (rect.bottom + 2) + "px";
        list.style.width = rect.width + "px";
        list.style.zIndex = "99999";

    }


    // 열기
    function showList() {

        // 다른 드롭다운 모두 닫기
        document.querySelectorAll(".dropdownList.show").forEach(el => {

            if (el !== list) {
                el.classList.remove("show");
            }

        });

        renderList(input.value);
        positionList();

        list.classList.add("show");
    }


    // 닫기
    function hideList() {
        list.classList.remove("show");
    }

    // 바깥 클릭 시 닫기
    document.addEventListener("mousedown", (e) => {

        if (
            !wrapper.contains(e.target) &&
            !list.contains(e.target)
        ) {
            hideList();
        }

    });


    // 입력
    input.addEventListener("input", () => {

        if (onInput) {
            onInput(input.value);
        }

        showList();

    });

    // 클릭
    input.addEventListener("click", () => {

        showList();

    });

    // 포커스
    input.addEventListener("focus", () => {

        showList();

    });

    // 스크롤하면 위치 다시 계산
    window.addEventListener("scroll", () => {

        if (list.classList.contains("show")) {
            positionList();
        }

    }, true);

    // 화면 크기 변경
    window.addEventListener("resize", () => {

        if (list.classList.contains("show")) {
            positionList();
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
        },

        hide() {
            hideList();
        }
    };

}