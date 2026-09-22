// dropdown.js
export function createDropdown(options){
    const {
        items = [],
        placeholder = "내용",
        onSelect = null,
        onInput = null
    } = options;

    const wrapper = document.createElement("div");
    wrapper.className = "dropdown";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    input.className = "dropdownInput";

    const list = document.createElement("div");
    list.className = "dropdownList";

    wrapper.appendChild(input);
    document.body.appendChild(list);

    function renderList(keyword = ""){
        list.innerHTML = "";

        const text = String(keyword)
            .trim()
            .toLowerCase();

        items
            .filter(item =>
                String(item)
                    .toLowerCase()
                    .includes(text)
            )
            .forEach(item => {
                const div = document.createElement("div");
                div.className = "dropdownItem";
                div.textContent = item;

                div.addEventListener("mousedown",event => {
                    event.preventDefault();

                    input.value = item;
                    hideList();

                    if(onSelect){
                        onSelect(item);
                    }
                });

                list.appendChild(div);
            });
    }

    function positionList(){
        const rect = input.getBoundingClientRect();

        list.style.left = `${rect.left}px`;
        list.style.top = `${rect.bottom + 2}px`;
        list.style.width = `${rect.width}px`;
    }

    function showList(){
        document
            .querySelectorAll(".dropdownList.show")
            .forEach(element => {
                if(element !== list){
                    element.classList.remove("show");
                }
            });

        renderList(input.value);
        positionList();
        list.classList.add("show");
    }

    function hideList(){
        list.classList.remove("show");
    }

    function handleOutside(event){
        if(
            !wrapper.contains(event.target) &&
            !list.contains(event.target)
        ){
            hideList();
        }
    }

    function handlePosition(){
        if(list.classList.contains("show")){
            positionList();
        }
    }

    document.addEventListener("mousedown",handleOutside);

    input.addEventListener("input",() => {
        if(onInput){
            onInput(input.value);
        }

        showList();
    });

    input.addEventListener("click",showList);
    input.addEventListener("focus",showList);
    window.addEventListener("scroll",handlePosition,true);
    window.addEventListener("resize",handlePosition);

    return {
        element:wrapper,

        get value(){
            return input.value.trim();
        },

        set value(value){
            input.value = value ?? "";
        },

        focus(){
            input.focus();
        },

        hide(){
            hideList();
        }
    };
}