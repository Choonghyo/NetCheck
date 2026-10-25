
const serviceName = "Net:Check";
let isSubscribed = false;
let submitCount = 0;

// 서비스 소식 신청
function makeSubscribeMessage(email, subscribed){
    if(subscribed == true){
        return email + "로 서비스 소식 신청이 완료되었습니다.";
    }
    return "이메일을 입력한 뒤 신청해 주세요.";
}

const subscribeForm = document.querySelector("#subscribe-form");
const emailInput = document.querySelector("#email");
const subscribeButton = document.querySelector("#subscribeButton");
const subscribeMessage = document.querySelector("#subscribeMessage");

function handleSubscribe(event){
    event.preventDefault();
    const subscribeEmail = emailInput.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(subscribeEmail === ""){
        subscribeMessage.textContent = "이메일 주소를 입력해 주세요.";
        subscribeMessage.classList.remove("is-success");
        subscribeMessage.classList.add("is-error");
        emailInput.focus();
        return;
    }

    if(!emailPattern.test(subscribeEmail)){
        subscribeMessage.textContent = "올바른 이메일 주소를 입력해 주세요.";
        subscribeMessage.classList.remove("is-success");
        subscribeMessage.classList.add("is-error");
        emailInput.focus();
        return;
    }

    isSubscribed = true;
    submitCount += 1;
    subscribeMessage.textContent = makeSubscribeMessage(subscribeEmail, isSubscribed);
    subscribeMessage.classList.remove("is-error");
    subscribeMessage.classList.add("is-success");
    subscribeButton.textContent = "신청 완료";
    subscribeButton.disabled = true;
}

subscribeForm.addEventListener("submit", handleSubscribe);

// 화면 테마 및 담당자 정보
const themeButton = document.querySelector("#themeButton");
const nicknameInput = document.querySelector("#nickname");
const nicknameCount = document.querySelector("#nicknameCount");
const agreeCheck = document.querySelector("#agreeCheck");
const agreeMessage = document.querySelector("#agreeMessage");
const startButton = document.querySelector("#startButton");

function handleThemeClick(){
    const isDark = document.body.classList.toggle("dark");
    themeButton.textContent = isDark ? "라이트 테마로 바꾸기" : "다크 테마로 바꾸기";
}

themeButton.addEventListener("click", handleThemeClick);

function handleNicknameInput(){
    const maxLength = nicknameInput.maxLength;
    const currentLength = Math.min(nicknameInput.value.length, maxLength);
    nicknameCount.textContent = currentLength + " / " + maxLength;
}

nicknameInput.addEventListener("input", handleNicknameInput);

function handleAgreeChange(){
    const agreed = agreeCheck.checked;
    startButton.disabled = !agreed;
    agreeMessage.textContent = agreed
        ? "안내 사항을 확인했습니다. 장비 점검을 시작할 수 있습니다."
        : "안내 사항을 확인한 후 장비 점검을 시작할 수 있습니다.";

    if(agreed){
        agreeMessage.classList.add("is-ready");
    } else {
        agreeMessage.classList.remove("is-ready");
    }
}

agreeCheck.addEventListener("change", handleAgreeChange);

// 주요 기능 탭 전환
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");

function resetTabsAndPanels(){
    tabs.forEach(function(tab){
        tab.classList.remove("is-active");
        tab.setAttribute("aria-selected", "false");
    });

    panels.forEach(function(panel){
        panel.classList.remove("is-active");
        panel.hidden = true;
    });
}

function activateTab(clickedTab){
    const targetSelector = clickedTab.dataset.target;
    const targetPanel = document.querySelector(targetSelector);

    clickedTab.classList.add("is-active");
    clickedTab.setAttribute("aria-selected", "true");
    targetPanel.classList.add("is-active");
    targetPanel.hidden = false;
}

function handleTabClick(event){
    resetTabsAndPanels();
    activateTab(event.currentTarget);
}

tabs.forEach(function(tab){
    tab.addEventListener("click", handleTabClick);
});

// 장비 점검 단계 및 입력 요소
const inspectionFlow = document.querySelector("#inspection-flow");
const flowSteps = inspectionFlow.querySelectorAll(".step");
const progressItems = inspectionFlow.querySelectorAll(".progress_item");

const equipmentName = document.querySelector("#equipment-name");
const equipmentLocation = document.querySelector("#equipment-location");
const equipmentType = document.querySelector("#equipment-type");
const equipmentNameError = document.querySelector("#equipment-name-error");
const equipmentLocationError = document.querySelector("#equipment-location-error");
const equipmentTypeError = document.querySelector("#equipment-type-error");
const equipmentNext = document.querySelector("#equipment-next");

const durationRange = document.querySelector("#duration-range");
const durationValue = document.querySelector("#duration-value");
const additionalOption = document.querySelector("#additional-option");
const additionalOptions = document.querySelector("#additional-options");
const optionPrev = document.querySelector("#option-prev");
const optionNext = document.querySelector("#option-next");

const summaryPrev = document.querySelector("#summary-prev");
const summaryNext = document.querySelector("#summary-next");
const summaryInspector = document.querySelector("#summary-inspector");
const summaryName = document.querySelector("#summary-name");
const summaryLocation = document.querySelector("#summary-location");
const summaryType = document.querySelector("#summary-type");
const summaryDuration = document.querySelector("#summary-duration");
const summaryAdditional = document.querySelector("#summary-additional");

const durationValues = ["5", "10", "20"];

const formData = {
    inspector: "",
    name: "",
    location: "",
    type: "",
    duration: "10",
    additional: false,
    additionalCount: "2",
    power: "",
    link: "",
    alarm: "",
    status: "",
    message: "",
    actions: []
};

// 단계별 화면 표시
function showStep(index){
    flowSteps.forEach(function(step, i){
        step.hidden = i !== index;
    });

    progressItems.forEach(function(item, i){
        item.classList.toggle("is-active", i === index);
    });

    inspectionFlow.scrollIntoView({behavior: "smooth", block: "start"});
}

// 점검 시작 안내 팝업
const inspectionDialog = document.querySelector("#inspection-dialog");
const inspectionCancel = document.querySelector("#inspection-cancel");
const inspectionConfirm = document.querySelector("#inspection-confirm");

function revokeInspectionAgreement(){
    agreeCheck.checked = false;
    inspectionFlow.hidden = true;
    handleAgreeChange();
    agreeCheck.focus();
}

startButton.addEventListener("click", function(){
    if(!agreeCheck.checked) return;

    const inspector = nicknameInput.value.trim();

    if(inspector === ""){
        agreeMessage.textContent = "점검 담당자 이름을 먼저 입력해 주세요.";
        agreeMessage.classList.remove("is-ready");
        nicknameInput.focus();
        return;
    }

    inspectionDialog.showModal();
});

inspectionCancel.addEventListener("click", function(){
    inspectionDialog.close();
    revokeInspectionAgreement();
});

inspectionDialog.addEventListener("cancel", function(){
    revokeInspectionAgreement();
});

inspectionConfirm.addEventListener("click", function(){
    if(!agreeCheck.checked) return;

    const inspector = nicknameInput.value.trim();

    if(inspector === ""){
        inspectionDialog.close();
        agreeMessage.textContent = "점검 담당자 이름을 입력해 주세요.";
        nicknameInput.focus();
        return;
    }

    formData.inspector = inspector;
    inspectionDialog.close();
    inspectionFlow.hidden = false;
    showStep(0);
    equipmentName.focus();
});

// 장비 정보 입력 오류 표시
function showInputError(input, errorElement, message){
    errorElement.textContent = message;
    input.classList.add("has-error");
}

function clearInputError(input, errorElement){
    errorElement.textContent = "";
    input.classList.remove("has-error");
}

// 장비 정보 유효성 검사
function validateEquipment(){
    const name = equipmentName.value.trim();
    const location = equipmentLocation.value.trim();
    const type = equipmentType.value;

    clearInputError(equipmentName, equipmentNameError);
    clearInputError(equipmentLocation, equipmentLocationError);
    clearInputError(equipmentType, equipmentTypeError);

    let isValid = true;
    let firstInvalidInput = null;

    if(name === ""){
        showInputError(equipmentName, equipmentNameError, "장비명을 입력해 주세요.");
        firstInvalidInput = equipmentName;
        isValid = false;
    }

    if(location === ""){
        showInputError(equipmentLocation, equipmentLocationError, "장비 설치 위치를 입력해 주세요.");
        if(firstInvalidInput === null) firstInvalidInput = equipmentLocation;
        isValid = false;
    }

    if(type === ""){
        showInputError(equipmentType, equipmentTypeError, "장비 종류를 선택해 주세요.");
        if(firstInvalidInput === null) firstInvalidInput = equipmentType;
        isValid = false;
    }

    if(!isValid){
        firstInvalidInput.focus();
        return false;
    }

    formData.name = name;
    formData.location = location;
    formData.type = type;
    return true;
}

equipmentNext.addEventListener("click", function(){
    if(!validateEquipment()) return;
    showStep(1);
});

// 입력값 수정 시 오류 메시지 제거
equipmentName.addEventListener("input", function(){
    clearInputError(equipmentName, equipmentNameError);
});

equipmentLocation.addEventListener("input", function(){
    clearInputError(equipmentLocation, equipmentLocationError);
});

equipmentType.addEventListener("change", function(){
    clearInputError(equipmentType, equipmentTypeError);
});

// 점검 소요시간 변경
durationRange.addEventListener("input", function(){
    durationValue.textContent = durationValues[durationRange.value] + "분";
});

// 추가 점검 항목 표시
additionalOption.addEventListener("change", function(){
    additionalOptions.hidden = !additionalOption.checked;
});

// 점검 조건 저장
function saveInspectionOptions(){
    formData.duration = durationValues[durationRange.value];
    formData.additional = additionalOption.checked;

    const selectedCount = document.querySelector('input[name="additional-count"]:checked');
    formData.additionalCount = selectedCount ? selectedCount.value : "2";
}

// 입력 정보 요약
function updateSummary(){
    summaryInspector.textContent = formData.inspector;
    summaryName.textContent = formData.name;
    summaryLocation.textContent = formData.location;
    summaryType.textContent = formData.type;
    summaryDuration.textContent = formData.duration + "분";
    summaryAdditional.textContent = formData.additional
        ? formData.additionalCount + "개 항목 포함"
        : "미포함";
}

optionPrev.addEventListener("click", function(){
    showStep(0);
});

optionNext.addEventListener("click", function(){
    saveInspectionOptions();
    updateSummary();
    showStep(2);
});

summaryPrev.addEventListener("click", function(){
    showStep(1);
});

summaryNext.addEventListener("click", function(){
    showStep(3);
});

// 장비 상태 진단 입력 요소
const diagnosisPrev = document.querySelector("#diagnosis-prev");
const diagnosisButton = document.querySelector("#diagnosis-button");
const diagnosisError = document.querySelector("#diagnosis-error");
const diagnosisResult = document.querySelector("#diagnosis-result");
const diagnosisStatus = document.querySelector("#diagnosis-status");
const diagnosisMessage = document.querySelector("#diagnosis-message");
const diagnosisActions = document.querySelector("#diagnosis-actions");
const diagnosisReset = document.querySelector("#diagnosis-reset");
const diagnosisFinish = document.querySelector("#diagnosis-finish");

// 장비 상태 선택값 확인
function getSelectedStatus(name){
    const selected = document.querySelector('input[name="' + name + '"]:checked');
    return selected ? selected.value : "";
}

// 장비 상태 입력 검사
function validateDiagnosis(){
    const power = getSelectedStatus("power-status");
    const link = getSelectedStatus("link-status");
    const alarm = getSelectedStatus("alarm-status");

    if(power === "" || link === "" || alarm === ""){
        diagnosisError.textContent = "전원, 링크, 알람 상태를 모두 선택해 주세요.";
        return false;
    }

    diagnosisError.textContent = "";
    formData.power = power;
    formData.link = link;
    formData.alarm = alarm;
    return true;
}

// 장비 상태 자동 판정
function analyzeEquipmentStatus(){
    const power = formData.power;
    const link = formData.link;
    const alarm = formData.alarm;

    if(power === "abnormal" || link === "down" || alarm === "critical"){
        formData.status = "점검 필요";
        formData.message = "장비 상태에 이상이 확인되었습니다. 원인을 확인하고 후속 점검을 진행해 주세요.";
    } else if(alarm === "minor"){
        formData.status = "주의";
        formData.message = "경미한 알람이 확인되었습니다. 알람 원인과 장비 상태를 추가로 확인해 주세요.";
    } else {
        formData.status = "정상";
        formData.message = "입력한 점검 항목에서 이상이 확인되지 않았습니다.";
    }

    formData.actions = [];

    if(power === "abnormal"){
        formData.actions.push("전원 공급 상태와 전원 케이블 및 전원 장치를 확인하세요.");
    }

    if(link === "down"){
        formData.actions.push("점검 대상 포트의 사용 여부와 광케이블, 연결 상태를 확인하세요.");
    }

    if(alarm === "critical"){
        formData.actions.push("중대 알람의 종류와 발생 시각을 확인하고 장애 대응 절차를 진행하세요.");
    }

    if(alarm === "minor"){
        formData.actions.push("경미한 알람의 발생 원인과 지속 여부를 확인하세요.");
    }

    if(formData.status === "정상"){
        formData.actions.push("현재 점검 상태를 기록하고 정기 점검을 유지하세요.");
    }

    if(formData.status === "주의"){
        formData.actions.push("알람 발생 이력을 확인하고 상태 변화를 관찰하세요.");
    }

    if(formData.status === "점검 필요"){
        formData.actions.push("필요한 경우 담당자에게 보고하고 조치 후 상태를 다시 확인하세요.");
    }
}

// 진단 결과 화면 표시
function displayDiagnosisResult(){
    diagnosisStatus.textContent = formData.status;
    diagnosisMessage.textContent = formData.message;
    diagnosisStatus.classList.remove("status-normal", "status-warning", "status-critical");

    if(formData.status === "정상"){
        diagnosisStatus.classList.add("status-normal");
    } else if(formData.status === "주의"){
        diagnosisStatus.classList.add("status-warning");
    } else {
        diagnosisStatus.classList.add("status-critical");
    }

    diagnosisActions.innerHTML = "";

    formData.actions.forEach(function(action){
        const listItem = document.createElement("li");
        listItem.textContent = action;
        diagnosisActions.appendChild(listItem);
    });

    diagnosisResult.hidden = false;
    diagnosisResult.scrollIntoView({behavior: "smooth", block: "nearest"});
}

// 진단 실행
diagnosisButton.addEventListener("click", function(){
    if(!validateDiagnosis()){
        diagnosisResult.hidden = true;
        return;
    }

    analyzeEquipmentStatus();
    displayDiagnosisResult();
});

// 진단 입력 변경 시 이전 결과 숨기기
const diagnosisInputs = document.querySelectorAll('input[name="power-status"], input[name="link-status"], input[name="alarm-status"]');

diagnosisInputs.forEach(function(input){
    input.addEventListener("change", function(){
        diagnosisError.textContent = "";
        diagnosisResult.hidden = true;
    });
});

// 진단 이전 단계
diagnosisPrev.addEventListener("click", function(){
    diagnosisResult.hidden = true;
    showStep(2);
});

// 진단 항목 초기화
function resetDiagnosis(){
    diagnosisInputs.forEach(function(input){
        input.checked = false;
    });

    diagnosisError.textContent = "";
    diagnosisResult.hidden = true;
    diagnosisStatus.textContent = "";
    diagnosisMessage.textContent = "";
    diagnosisActions.innerHTML = "";
    diagnosisStatus.classList.remove("status-normal", "status-warning", "status-critical");

    formData.power = "";
    formData.link = "";
    formData.alarm = "";
    formData.status = "";
    formData.message = "";
    formData.actions = [];
}

diagnosisReset.addEventListener("click", function(){
    resetDiagnosis();
    diagnosisInputs[0].focus();
});

// 점검 완료 정보
const completeName = document.querySelector("#complete-name");
const completeType = document.querySelector("#complete-type");
const completeInspector = document.querySelector("#complete-inspector");
const completeStatus = document.querySelector("#complete-status");
const completeMessage = document.querySelector("#complete-message");
const restartButton = document.querySelector("#restart-button");

// 최종 점검 결과 표시
function displayCompleteResult(){
    completeName.textContent = formData.name;
    completeType.textContent = formData.type;
    completeInspector.textContent = formData.inspector;
    completeStatus.textContent = formData.status;
    completeStatus.classList.remove("status-normal", "status-warning", "status-critical");

    if(formData.status === "정상"){
        completeStatus.classList.add("status-normal");
    } else if(formData.status === "주의"){
        completeStatus.classList.add("status-warning");
    } else {
        completeStatus.classList.add("status-critical");
    }

    completeMessage.replaceChildren();

    const message = document.createElement("p");
    message.textContent = formData.message;
    completeMessage.appendChild(message);

    const title = document.createElement("h4");
    title.textContent = "권장 점검 사항";
    completeMessage.appendChild(title);

    const actionList = document.createElement("ul");

    formData.actions.forEach(function(action){
        const listItem = document.createElement("li");
        listItem.textContent = action;
        actionList.appendChild(listItem);
    });

    completeMessage.appendChild(actionList);
}

// 점검 결과 확정
diagnosisFinish.addEventListener("click", function(){
    if(formData.status === ""){
        diagnosisError.textContent = "장비 상태를 먼저 분석해 주세요.";
        return;
    }

    displayCompleteResult();
    showStep(4);
});

// 새로운 장비 점검 시작
function resetInspection(){
    formData.inspector = nicknameInput.value.trim();
    formData.name = "";
    formData.location = "";
    formData.type = "";
    formData.duration = "10";
    formData.additional = false;
    formData.additionalCount = "2";

    equipmentName.value = "";
    equipmentLocation.value = "";
    equipmentType.value = "";

    clearInputError(equipmentName, equipmentNameError);
    clearInputError(equipmentLocation, equipmentLocationError);
    clearInputError(equipmentType, equipmentTypeError);

    durationRange.value = "1";
    durationValue.textContent = "10분";
    additionalOption.checked = false;
    additionalOptions.hidden = true;

    const defaultAdditionalCount = document.querySelector('input[name="additional-count"][value="2"]');
    defaultAdditionalCount.checked = true;

    summaryInspector.textContent = "";
    summaryName.textContent = "";
    summaryLocation.textContent = "";
    summaryType.textContent = "";
    summaryDuration.textContent = "";
    summaryAdditional.textContent = "";

    resetDiagnosis();

    completeName.textContent = "";
    completeType.textContent = "";
    completeInspector.textContent = "";
    completeStatus.textContent = "";
    completeStatus.classList.remove("status-normal", "status-warning", "status-critical");
    completeMessage.replaceChildren();

    showStep(0);
    equipmentName.focus();
}

restartButton.addEventListener("click", resetInspection);

// 초기 화면 상태 설정
handleNicknameInput();
handleAgreeChange();
showStep(0);
inspectionFlow.hidden = true;
