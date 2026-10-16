import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import { BUSINESS_INFO } from '@/lib/legal';

export const metadata: Metadata = {
    title: 'Política de Privacidade | Otterfy',
    description: 'Saiba como a Otterfy recolhe, utiliza, armazena e protege os seus dados pessoais em conformidade com a legislação de Moçambique.',
};

export default function PrivacyPolicyPage() {
    return (
        <LegalPageLayout
            title="Política de Privacidade e Proteção de Dados"
            subtitle="Transparência sobre como tratamos os seus dados pessoais, financeiros e técnicos ao utilizar a plataforma Otterfy."
            currentPath="/privacidade"
        >
            <div className="space-y-8 text-slate-700 leading-relaxed text-[15px]">
                <section aria-labelledby="sec-intro">
                    <h2 id="sec-intro" className="text-xl font-bold text-slate-900 mb-3">
                        1. Introdução e Responsável pelo Tratamento
                    </h2>
                    <p className="mb-3">
                        A <strong>{BUSINESS_INFO.legalName}</strong> (&ldquo;{BUSINESS_INFO.brandName}&rdquo;, &ldquo;nós&rdquo; ou &ldquo;Plataforma&rdquo;), registada com o NUIT <strong>{BUSINESS_INFO.nuit}</strong> e com sede em {BUSINESS_INFO.address}, respeita a sua privacidade e compromete-se a proteger os dados pessoais de compradores (&ldquo;Clientes&rdquo;) e vendedores (&ldquo;Produtores Digitais&rdquo;) em estrita conformidade com o artigo 71.º da Constituição da República de Moçambique, a <strong>Lei das Transações Eletrónicas (Lei n.º 3/2017, de 9 de Janeiro)</strong>, a <strong>Lei de Defesa do Consumidor (Lei n.º 22/2009, de 28 de Setembro)</strong> e os princípios internacionais de minimização de dados (incluindo o RGPD, quando aplicável).
                    </p>
                    <p>
                        Para qualquer questão relacionada com proteção de dados pessoais, pode contactar o nosso Encarregado de Proteção de Dados (DPO) através do e-mail{' '}
                        <a href={`mailto:${BUSINESS_INFO.dpoEmail}`} className="text-emerald-700 font-semibold underline hover:text-emerald-800">
                            {BUSINESS_INFO.dpoEmail}
                        </a>.
                    </p>
                </section>

                <section aria-labelledby="sec-minimisation">
                    <h2 id="sec-minimisation" className="text-xl font-bold text-slate-900 mb-3">
                        2. Dados que Recolhemos (Princípio da Minimização de Dados)
                    </h2>
                    <p className="mb-3">
                        Recolhemos <strong>apenas os dados estritamente necessários</strong> para executar a relação contratual, processar pagamentos móveis e entregar os produtos adquiridos:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>Dados de Checkout (Compradores):</strong> Nome completo, endereço de e-mail (para envio do acesso ao produto e recibo) e número de telefone móvel moçambicano (+258 84/85 para M-Pesa ou +258 86/87 para e-Mola) estritamente para iniciar a notificação STK Push de pagamento.
                        </li>
                        <li>
                            <strong>Dados de Conta (Produtores / Vendedores):</strong> Nome completo, endereço de e-mail, palavra-passe armazenada sob hash criptográfico irreversível (bcrypt) e informações de configuração de produtos e carteira de recebimento.
                        </li>
                        <li>
                            <strong>Dados Técnicos de Segurança (Estritamente Necessários):</strong> Endereço IP truncado/temporário para prevenção de fraude e limitação de taxa (rate limiting contra ataques automatizados), carimbo de data/hora da transação e registo de aceitação dos Termos e Políticas.
                        </li>
                        <li>
                            <strong>Dados de Marketing e Atribuição (Apenas com Consentimento Explícito):</strong> Parâmetros de campanha (<code>utm_source</code>, <code>utm_medium</code>, <code>utm_campaign</code>, <code>utm_content</code>, <code>utm_term</code>) e eventos de conversão (Meta Pixel / Conversions API e Utmify) são recolhidos e transmitidos <strong>exclusivamente se o utilizador tiver concedido consentimento prévio e explícito</strong> no banner de cookies.
                        </li>
                    </ul>
                    <p className="mt-3 text-sm bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700">
                        <strong>Nota Importante sobre PIN Móvel:</strong> A {BUSINESS_INFO.brandName} <strong>nunca solicita, recolhe nem tem acesso</strong> ao seu PIN do M-Pesa ou e-Mola. A confirmação do pagamento ocorre exclusivamente no visor seguro do seu próprio telemóvel (USSD/STK Push).
                    </p>
                </section>

                <section aria-labelledby="sec-basis">
                    <h2 id="sec-basis" className="text-xl font-bold text-slate-900 mb-3">
                        3. Finalidades e Bases Legais do Tratamento
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse border border-slate-200 text-sm">
                            <thead>
                                <tr className="bg-slate-100 text-slate-900">
                                    <th className="p-3 border border-slate-200 font-bold">Finalidade</th>
                                    <th className="p-3 border border-slate-200 font-bold">Dados Utilizados</th>
                                    <th className="p-3 border border-slate-200 font-bold">Base Legal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr>
                                    <td className="p-3 border border-slate-200">Processamento de pagamento via M-Pesa / e-Mola e entrega do produto digital</td>
                                    <td className="p-3 border border-slate-200">Nome, E-mail, Telefone, ID do Produto</td>
                                    <td className="p-3 border border-slate-200">Execução de contrato e consentimento expresso no formulário</td>
                                </tr>
                                <tr>
                                    <td className="p-3 border border-slate-200">Cumprimento de obrigações fiscais, contabilísticas e prevenção à fraude</td>
                                    <td className="p-3 border border-slate-200">Registo da transação, valor (MZN), data e referência do pagamento</td>
                                    <td className="p-3 border border-slate-200">Obrigação legal (Lei n.º 3/2017 e legislação fiscal moçambicana)</td>
                                </tr>
                                <tr>
                                    <td className="p-3 border border-slate-200">Segurança da infraestrutura e bloqueio de acessos abusivos (Rate Limiting)</td>
                                    <td className="p-3 border border-slate-200">Endereço IP e cabeçalhos técnicos de requisição</td>
                                    <td className="p-3 border border-slate-200">Interesse legítimo de segurança da informação</td>
                                </tr>
                                <tr>
                                    <td className="p-3 border border-slate-200">Atribuição de campanhas publicitárias do Produtor (Meta Pixel / CAPI / Utmify)</td>
                                    <td className="p-3 border border-slate-200">Parâmetros UTM, identificadores de clique e hash de conversão</td>
                                    <td className="p-3 border border-slate-200">Consentimento prévio e revogável (Opt-in de Marketing)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section aria-labelledby="sec-sharing">
                    <h2 id="sec-sharing" className="text-xl font-bold text-slate-900 mb-3">
                        4. Partilha de Dados com Terceiros e Subcontratantes
                    </h2>
                    <p className="mb-3">
                        Não vendemos nem alugamos os seus dados pessoais a terceiros. Os dados são partilhados apenas com as entidades indispensáveis para a prestação do serviço:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>Produtor Digital (Vendedor):</strong> O criador do produto que adquiriu recebe o seu nome, e-mail e estado do pedido para prestar suporte ao cliente e cumprir a garantia de reembolso.
                        </li>
                        <li>
                            <strong>Operadoras e Gateways de Pagamento Móvel (Vodacom M-Pesa, Movitel e-Mola, PaySuite / Zenofy):</strong> Recebem o número de telefone e montante da transação para processar o débito autorizado no telemóvel.
                        </li>
                        <li>
                            <strong>Infraestrutura Técnica e Segurança:</strong> Fornecedores de alojamento de base de dados (Supabase/PostgreSQL) e proteção contra abuso de API (Upstash Redis) sob cláusulas de confidencialidade e encriptação em trânsito (TLS).
                        </li>
                        <li>
                            <strong>Plataformas de Anúncios (Meta Platforms, Inc. e Utmify):</strong> <em>Apenas se o comprador ativar os cookies de marketing</em> e quando o Produtor tiver configurado o respetivo pixel no produto. Caso o comprador escolha &ldquo;Rejeitar Opcionais&rdquo;, nenhum dado nem script é carregado ou enviado para a Meta ou Utmify.
                        </li>
                    </ul>
                </section>

                <section aria-labelledby="sec-retention">
                    <h2 id="sec-retention" className="text-xl font-bold text-slate-900 mb-3">
                        5. Prazo de Conservação dos Dados
                    </h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>
                            <strong>Registos de Transações Comerciais:</strong> Conservados pelo período legal exigido pela legislação comercial e tributária da República de Moçambique (regra geral, 5 a 10 anos para efeitos de auditoria fiscal), após o qual são anonimizados ou eliminados de forma segura.
                        </li>
                        <li>
                            <strong>Contas de Produtores:</strong> Conservadas enquanto a conta permanecer ativa. Após pedido de encerramento, os dados de perfil são eliminados ou anonimizados num prazo máximo de 30 dias, ressalvadas as obrigações legais de retenção de faturas e transações.
                        </li>
                        <li>
                            <strong>Registos de Consentimento de Cookies:</strong> Armazenados localmente no seu navegador por até 180 dias ou até que limpe os dados de navegação / altere as suas preferências.
                        </li>
                    </ul>
                </section>

                <section aria-labelledby="sec-rights">
                    <h2 id="sec-rights" className="text-xl font-bold text-slate-900 mb-3">
                        6. Os Seus Direitos enquanto Titular dos Dados
                    </h2>
                    <p className="mb-3">
                        Ao abrigo da legislação aplicável (artigo 71.º da Constituição da República de Moçambique e Lei n.º 3/2017), assistem-lhe os seguintes direitos gratuitos:
                    </p>
                    <ul className="list-disc pl-6 space-y-1.5">
                        <li><strong>Direito de Acesso:</strong> Obter confirmação sobre que dados pessoais tratamos a seu respeito e solicitar uma cópia.</li>
                        <li><strong>Direito de Retificação:</strong> Corrigir dados pessoais inexatos, incompletos ou desatualizados.</li>
                        <li><strong>Direito de Eliminação / Anonimização:</strong> Solicitar o apagamento dos seus dados quando já não sejam necessários para a finalidade que motivou a recolha, sem prejuízo dos prazos legais de retenção fiscal.</li>
                        <li><strong>Direito de Revogação do Consentimento:</strong> Retirar o seu consentimento para cookies analíticos ou de marketing a qualquer momento através da nossa <Link href="/cookies" className="text-emerald-700 font-semibold underline hover:text-emerald-800">Política de Cookies</Link>.</li>
                        <li><strong>Direito de Oposição:</strong> Opor-se ao tratamento dos seus dados para fins de comunicações promocionais.</li>
                    </ul>
                    <p className="mt-3">
                        Para exercer qualquer um destes direitos, envie um pedido para{' '}
                        <a href={`mailto:${BUSINESS_INFO.dpoEmail}`} className="text-emerald-700 font-semibold underline hover:text-emerald-800">
                            {BUSINESS_INFO.dpoEmail}
                        </a>. Responderemos no prazo máximo de 15 dias úteis.
                    </p>
                </section>

                <section aria-labelledby="sec-security">
                    <h2 id="sec-security" className="text-xl font-bold text-slate-900 mb-3">
                        7. Medidas de Segurança
                    </h2>
                    <p>
                        Adotamos controlos técnicos rigorosos para proteger os seus dados, incluindo comunicação encriptada via HTTPS/TLS, cabeçalhos de política de segurança de conteúdo (Content-Security-Policy com nonces dinâmicos), hashing de palavras-passe com bcrypt, validação estrita de esquemas de dados no servidor e não-exposição de dados pessoais em registos (logs) de diagnóstico.
                    </p>
                </section>
            </div>
        </LegalPageLayout>
    );
}
