import React from 'react';
import type { Metadata } from 'next';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import { BUSINESS_INFO } from '@/lib/legal';

export const metadata: Metadata = {
    title: 'Política de Reembolso e Devolução | Otterfy',
    description: 'Conheça os seus direitos de arrependimento, garantia de 7 dias e procedimentos de reembolso via M-Pesa e e-Mola na Otterfy.',
};

export default function RefundPolicyPage() {
    return (
        <LegalPageLayout
            title="Política de Reembolso, Cancelamento e Devolução"
            subtitle="Procedimentos claros e transparentes para solicitar o reembolso das suas compras em conformidade com a Lei de Defesa do Consumidor de Moçambique."
            currentPath="/reembolso"
        >
            <div className="space-y-8 text-slate-700 leading-relaxed text-[15px]">
                <section aria-labelledby="refund-guarantee">
                    <h2 id="refund-guarantee" className="text-xl font-bold text-slate-900 mb-3">
                        1. Prazo Legal de Arrependimento e Garantia ({BUSINESS_INFO.refundPeriodDays} Dias)
                    </h2>
                    <p className="mb-3">
                        Em conformidade com a <strong>Lei de Defesa do Consumidor de Moçambique (Lei n.º 22/2009, de 28 de Setembro)</strong> e a <strong>Lei das Transações Eletrónicas (Lei n.º 3/2017, de 9 de Janeiro)</strong>, todo o comprador tem o direito de solicitar o cancelamento e reembolso integral da compra de um produto digital no prazo mínimo de <strong>{BUSINESS_INFO.refundPeriodDays} (sete) dias corridos</strong> a contar da data de confirmação do pagamento (ou prazo superior, caso o Produtor tenha anunciado um período de garantia estendido de 15 ou 30 dias na página do produto).
                    </p>
                </section>

                <section aria-labelledby="refund-eligibility">
                    <h2 id="refund-eligibility" className="text-xl font-bold text-slate-900 mb-3">
                        2. Condições de Elegibilidade
                    </h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>Dentro do Prazo de Garantia ({BUSINESS_INFO.refundPeriodDays} dias):</strong> O reembolso pode ser solicitado por insatisfação com o conteúdo, divergência em relação à descrição da oferta ou arrependimento da compra. Após a aprovação do reembolso, o acesso ao produto digital ou área de membros é imediatamente revogado.
                        </li>
                        <li>
                            <strong>Falha Técnica, Cobrança em Duplicado ou Não Entrega:</strong> Caso tenha ocorrido débito comprovado na sua conta M-Pesa ou e-Mola em duplicado, ou se o ficheiro/acesso apresentar defeito técnico insanável, o direito à restituição integral aplica-se independentemente do prazo de {BUSINESS_INFO.refundPeriodDays} dias.
                        </li>
                    </ul>
                </section>

                <section aria-labelledby="refund-how">
                    <h2 id="refund-how" className="text-xl font-bold text-slate-900 mb-3">
                        3. Como Solicitar um Reembolso
                    </h2>
                    <p className="mb-3">
                        Para solicitar o seu reembolso de forma simples e rápida, envie um e-mail para{' '}
                        <a href={`mailto:${BUSINESS_INFO.supportEmail}`} className="text-emerald-700 font-semibold underline hover:text-emerald-800">
                            {BUSINESS_INFO.supportEmail}
                        </a>{' '}
                        indicando os seguintes dados:
                    </p>
                    <ol className="list-decimal pl-6 space-y-2">
                        <li><strong>ID do Pedido</strong> (ou o endereço de e-mail utilizado no checkout);</li>
                        <li><strong>Número de telefone M-Pesa ou e-Mola</strong> utilizado no pagamento (+258 84/85/86/87...);</li>
                        <li><strong>Nome do produto adquirido</strong> e breve descrição do motivo do pedido.</li>
                    </ol>
                </section>

                <section aria-labelledby="refund-timeline">
                    <h2 id="refund-timeline" className="text-xl font-bold text-slate-900 mb-3">
                        4. Prazos e Meio de Devolução dos Valores
                    </h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>Análise do Pedido:</strong> Todos os pedidos de reembolso recebem confirmação e resposta em até <strong>48 horas úteis</strong>.
                        </li>
                        <li>
                            <strong>Liquidação Financeira:</strong> Uma vez validado o pedido dentro do prazo de garantia, a devolução do montante integral em Meticais (MZN), sem cobrança de taxas de cancelamento ao consumidor, é processada num prazo máximo de <strong>5 (cinco) dias úteis</strong> diretamente para a mesma carteira móvel (M-Pesa ou e-Mola) utilizada na compra original.
                        </li>
                    </ul>
                </section>
            </div>
        </LegalPageLayout>
    );
}
