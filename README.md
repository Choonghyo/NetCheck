12주차

1. UI 컴포넌트 3종 구현
- 탭: 주요기능 선택시 해당 내용표시,상태변경
- 모달: 점검시작 안내,기록 상세팝업(열기/닫기)
- 아코디언: 전원,링크,알람점검도움말 펼지기/접기

2. 유저조작및 상태변환
- 탭 밑줄과 선택상태 표시
- 도움말 펼치기/접기 문구, 내용변경
- 기록 취소/복원 시 상태버튼문구변경

3. 재사용 구조
- 공통 다지인 토큰,버튼,모달, 아코디언css 적용
- 인잇 탭/아코디언 열기/닫기 공통함수 적용
- 점검 기록 카드 반복 생성
- 사이드바, 좁은화면 메뉴/700px 이하 한열 배치

4. 웹 접근성 및 확인 방법
- 탭, 엔터, 스페이스로 버튼 조작,초점표시
- 탭 방향키,홈,End로 선택 이동
- 모달 Esc/닫기 버튼으로 종료 다음 초점이동
- 아코디언 aria-expanded, 탭 aria-selected, 메뉴 aria-current 적용
- 다크/라이트모드,좁은 화면에서 표시 상태확인

GitHub Repository URL
https://github.com/Choonghyo/NetCheck

Published Website URL
https://choonghyo.github.io/NetCheck/