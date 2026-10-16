import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import { BUSINESS_INFO } from '@/lib/legal';

export const metadata: Metadata = {
    title: 'Termos e Condições de Uso | Otterfy',
    description: 'Termos e Condições Gerais de Utilização da plataforma Otterfy para compradores e produtores digitais em Moçambique.',
};

export default function TermsPage() {
    return (
        <LegalPageLayout
            title="Termos e Condições Gerais de Utilização"
            subtitle="Regras contratuais aplicáveis à utilização da plataforma Otterfy por Compradores e Produtores Digitais."
            currentPath="/termos"
        >
            <div className="space-y-8 text-slate-700 leading-relaxed text-[15px]">
                <section aria-labelledby="terms-object">
                    <h2 id="terms-object" className="text-xl font-bold text-slate-900 mb-3">
                        1. Objeto e Papel da Plataforma
                    </h2>
                    <p className="mb-3">
                        Os presentes Termos e Condições regulam o acesso e utilização da plataforma tecnológica operada pela <strong>{BUSINESS_INFO.legalName}</strong> (NUIT {BUSINESS_INFO.nuit}), com sede em {BUSINESS_INFO.address}.
                    </p>
                    <p>
                        A <strong>{BUSINESS_INFO.brandName}</strong> atua como intermediária tecnológica de processamento de checkouts e entrega automatizada de produtos digitais (e-books, cursos, ficheiros e mentorias). O conteúdo, qualidade pedagógica, veracidade das informações publicitárias e cumprimento da oferta de cada produto são da responsabilidade direta do respetivo <strong>Produtor Digital (Vendedor)</strong> identificado na página de pagamento, sem prejuízo dos mecanismos de proteção ao consumidor garantidos pela Plataforma.
                    </p>
                </section>

                <section aria-labelledby="terms-buyers">
                    <h2 id="terms-buyers" className="text-xl font-bold text-slate-900 mb-3">
                        2. Condições para Compradores (Consumidores)
                    </h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>Capacidade Legal:</strong> Ao efetuar uma compra, o Comprador declara ter pelo menos 18 anos de idade (ou autorização dos seus representantes legais) e ser o titular legítimo da conta móvel M-Pesa ou e-Mola utilizada.
                        </li>
                        <li>
                            <strong>Preços e Moeda:</strong> Todos os preços apresentados no checkout são expressos em <strong>Meticais Moçambicanos (MZN / MT)</strong> e incluem as taxas aplicáveis ao processamento da compra na plataforma.
                        </li>
                        <li>
                            <strong>Entrega Imediata:</strong> Após a confirmação de liquidação pela operadora móvel (Vodacom M-Pesa ou Movitel e-Mola), o acesso ao produto digital é disponibilizado imediatamente no ecrã de confirmação e através da ligação segura de acesso associada ao pedido.
                        </li>
                        <li>
                            <strong>Licença de Uso Pessoal:</strong> Os produtos digitais adquiridos destinam-se exclusivamente ao uso pessoal e intransmissível do Comprador, sendo proibida a revenda, partilha pública ou reprodução não autorizada, nos termos da Lei dos Direitos de Autor (Lei n.º 4/2001).
                        </li>
                    </ul>
                </section>

                <section aria-labelledby="terms-producers">
                    <h2 id="terms-producers" className="text-xl font-bold text-slate-900 mb-3">
                        3. Obrigações dos Produtores Digitais (Vendedores)
                    </h2>
                    <p className="mb-3">
                        Ao criar conta e cadastrar produtos na {BUSINESS_INFO.brandName}, o Produtor compromete-se expressamente a:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>Titularidade e Direitos de Autor:</strong> Comercializar apenas conteúdos, imagens, logótipos e materiais de que seja titular legítimo ou detenha licença comercial válida (Lei n.º 4/2001).
                        </li>
                        <li>
                            <strong>Proibição de Publicidade Enganosa:</strong> Não utilizar avaliações falsas, notificações simuladas de vendas, promessas irrealistas de ganhos financeiros garantidos ou alegações médicas/técnicas sem comprovação, em cumprimento da Lei de Defesa do Consumidor (Lei n.º 22/2009).
                        </li>
                        <li>
                            <strong>Cumprimento da Garantia de Reembolso:</strong> Respeitar integralmente o prazo mínimo de reembolso de {BUSINESS_INFO.refundPeriodDays} dias corridos previsto na nossa <Link href="/reembolso" className="text-emerald-700 font-semibold underline hover:text-emerald-800">Política de Reembolso</Link>.
                        </li>
                        <li>
                            <strong>Conteúdos Proibidos:</strong> É estritamente proibida a venda de esquemas de pirâmide financeira, software malicioso, material que viole direitos de terceiros, conteúdos ilegais ou produtos que infrinjam normas do Banco de Moçambique. A violação resulta na suspensão imediata da conta e retenção preventiva de saldo para reembolso aos compradores lesados.
                        </li>
                    </ul>
                </section>

                <section aria-labelledby="terms-payments">
                    <h2 id="terms-payments" className="text-xl font-bold text-slate-900 mb-3">
                        4. Pagamentos Móveis e Marcas Registadas
                    </h2>
                    <p className="mb-3">
                        Os pagamentos são processados através de integrações autorizadas com as redes de moeda eletrónica em Moçambique. Eventuais indisponibilidades temporárias nas redes USSD das operadoras de telecomunicações são alheias ao controlo da {BUSINESS_INFO.brandName}; caso ocorra débito sem emissão imediata de acesso por falha de rede, o nosso suporte valida o comprovativo junto do gateway e liberta o acesso ou restitui o valor integral.
                    </p>
                    <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <strong>Aviso de Propriedade Intelectual de Terceiros:</strong> M-Pesa® é uma marca registada da Vodacom Moçambique, S.A. / Vodafone Group Plc. e-Mola® é uma marca registada da Movitel, S.A. A menção a estas marcas no checkout destina-se exclusivamente a identificar os meios de pagamento compatíveis.
                    </p>
                </section>

                <section aria-labelledby="terms-liability">
                    <h2 id="terms-liability" className="text-xl font-bold text-slate-900 mb-3">
                        5. Limitação de Responsabilidade e Disponibilidade
                    </h2>
                    <p>
                        A {BUSINESS_INFO.brandName} envida todos os esforços técnicos para manter a plataforma disponível e segura, mas não garante resultados financeiros ou subjetivos decorrentes da aplicação de cursos ou e-books comercializados por terceiros. Nada nestes Termos exclui ou limita os direitos inderrogáveis conferidos ao consumidor pela Lei n.º 22/2009.
                    </p>
                </section>

                <section aria-labelledby="terms-law">
                    <h2 id="terms-law" className="text-xl font-bold text-slate-900 mb-3">
                        6. Lei Aplicável e Foro Competente
                    </h2>
                    <p>
                        Estes Termos e Condições regem-se pelas leis da <strong>República de Moçambique</strong>, nomeadamente a Lei n.º 3/2017 (Lei das Transações Eletrónicas) e a Lei n.º 22/2009 (Lei de Defesa do Consumidor). Para a resolução de qualquer litígio emergente da utilização da Plataforma, é competente o foro do Tribunal Judicial da Cidade de Maputo, sem prejuízo do foro legalmente assegurado ao consumidor no seu domicílio.
                    </p>
                </section>
            </div>
        </LegalPageLayout>
    );
}
