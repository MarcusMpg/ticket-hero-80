import emailjs from "@emailjs/browser";

// Credenciais do EmailJS - substitua pelos seus valores
const SERVICE_ID = "service_7vi9pll";
const TEMPLATE_ID = "template_i5gmkvu";
const PUBLIC_KEY = "mPBimvFScFLs__Zm7";

interface EmailParams {
  to_email: string;
  to_name: string;
  chamado_titulo: string;
  chamado_descricao: string;
  chamado_prioridade: string;
  solicitante_nome: string;
}

export const enviarNotificacaoNovoChamado = async (
  params: EmailParams
): Promise<boolean> => {
  try {
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: params.to_email,
        to_name: params.to_name,
        chamado_titulo: params.chamado_titulo,
        chamado_descricao: params.chamado_descricao,
        chamado_prioridade: params.chamado_prioridade,
        solicitante_nome: params.solicitante_nome,
      },
      PUBLIC_KEY
    );

    console.log("Email enviado com sucesso:", response);
    return true;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return false;
  }
};

// Inicializa o EmailJS
export const initEmailJS = () => {
  emailjs.init(PUBLIC_KEY);
};
