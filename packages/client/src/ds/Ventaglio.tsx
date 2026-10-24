// Il logo del gioco: due carte con la stessa parola e, in mezzo, quella dell'impostore.

function CartaLaterale({ lato, colore }: { lato: 'sx' | 'dx'; colore: string }) {
  return (
    <div
      className="absolute top-[52px] flex h-[200px] w-[142px] flex-col justify-between rounded-[22px] p-4 text-inchiostro shadow-[0_18px_40px_rgba(0,0,0,.45)]"
      style={{ background: colore, transform: `rotate(${lato === 'sx' ? -14 : 14}deg)`, [lato === 'sx' ? 'left' : 'right']: 22 }}
    >
      <span className="font-titolo text-[11px] font-bold tracking-[1.5px]">PAROLA</span>
      <span className="font-titolo text-2xl font-extrabold">PIZZA</span>
    </div>
  );
}

export function Ventaglio({ piccolo }: { piccolo?: boolean }) {
  return (
    <div aria-hidden="true" className={`relative mx-auto w-[342px] ${piccolo ? 'h-[250px] origin-top scale-75 -mb-16' : 'h-[300px]'}`}>
      <div className="absolute -left-4 -top-36 h-[420px] w-[420px] rounded-full bg-cerchio" />
      <CartaLaterale lato="sx" colore="#FFD23F" />
      <CartaLaterale lato="dx" colore="#9B8CFF" />
      <div className="absolute left-1/2 top-5 -ml-20 flex h-[226px] w-40 flex-col items-center justify-between rounded-3xl border-[3px] border-fondo bg-impostore p-[18px] text-inchiostro shadow-[0_24px_50px_rgba(0,0,0,.55)]">
        <span className="font-titolo text-[11px] font-bold tracking-[1.5px]">PAROLA</span>
        <span className="font-titolo text-8xl font-extrabold leading-none">?</span>
        <span className="font-titolo text-[11px] font-bold tracking-[1.5px]">???</span>
      </div>
    </div>
  );
}
