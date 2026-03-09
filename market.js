import { marketRecommendation } from '../core/utils.js';
import { updateState } from '../core/state.js';

export function renderMarket(state) {
  const market = marketRecommendation(Number(state.market.distributionDays || 0));
  return `
    <section class="grid grid-2">
      <div class="panel">
        <div class="section-title">Thị trường</div>
        <h2 class="big-title">Đánh giá theo số ngày phân phối</h2>
        <div class="form-row">
          <div>
            <div class="small">Ngày phân phối</div>
            <input id="dist-days" class="input" type="number" min="0" value="${state.market.distributionDays}" />
          </div>
        </div>
        <div class="actions"><button id="save-market" class="ui-btn ui-btn-green">Cập nhật</button></div>
        <div style="margin-top:16px" class="badge ${market.cls}">${market.text}</div>
        <div class="link-note">market.js cập nhật state → dashboard.js đọc lại cùng nguồn dữ liệu để đổi khuyến nghị và KPI.</div>
      </div>
      <div class="panel">
        <img class="module-image side-image" src="assets/images/thi_truong.png" alt="Thị trường" />
      </div>
    </section>
  `;
}

export function bindMarket(onChange) {
  document.getElementById('save-market')?.addEventListener('click', () => {
    const value = Number(document.getElementById('dist-days').value || 0);
    updateState(state => { state.market.distributionDays = value; });
    onChange();
  });
}
