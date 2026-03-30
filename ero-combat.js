window.HeroCombatModule = {
    enableGargonemBerserk: function(minLvlOffset = -20, maxLvlOffset = 100) {
        if (typeof window._g !== 'function') return;
        console.log("%c[SERWER BERSERK] Konfiguruję natywnego berserka...", "color: #00acc1; font-weight: bold;");
        window._g(`settings&action=update&id=34&v=1`);
        window._g(`settings&action=update&id=34&key=elite&v=1`);
        window._g(`settings&action=update&id=34&key=elite2&v=1`);
        window._g(`settings&action=update&id=34&key=lvlmin&v=${minLvlOffset}`);
        window._g(`settings&action=update&id=34&key=lvlmax&v=${maxLvlOffset}`);
    },
    disableGargonemBerserk: function() {
        if (typeof window._g === 'function') window._g(`settings&action=update&id=34&v=0`);
    },
    brutalAttack: function(targetId) {
        if (window.brutalAttackInterval) clearInterval(window.brutalAttackInterval);
        window.brutalAttackInterval = setInterval(() => {
            if (typeof Engine === 'undefined' || !Engine.hero || !Engine.hero.d) return;
            if (Engine.battle && (Engine.battle.show || Engine.battle.d)) {
                clearInterval(window.brutalAttackInterval);
                return;
            }
            if (Engine.npcs && typeof Engine.npcs.interact === 'function') Engine.npcs.interact(parseInt(targetId, 10));
            if (typeof window._g === 'function') window._g(`fight&a=attack&id=${targetId}`);
            let confirmBtn = document.querySelector(".green.button, .podejdz-btn, .zaatakuj-btn");
            if (confirmBtn) confirmBtn.click();
        }, 150);
    }
};
