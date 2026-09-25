import FileUploadDemo from "@/components/demos/FileUploadDemo";

export const metadata = { title: "Envio de arquivos" };

export default function EnvioDeArquivosPage() {
  return (
    <>
      <h1>Envio de arquivos</h1>
      <p className="subtitle">
        Área de arrastar-e-soltar com lista de arquivos, limite por tamanho e
        erro.
      </p>

      <h3>Demonstração</h3>
      <p>
        Arraste um arquivo para a área ou clique para selecionar pelo sistema.
        Arquivos que excedam o limite de tamanho são sinalizados com erro.
      </p>
      <div className="preview">
        <FileUploadDemo />
      </div>

      <h3>Quando usar</h3>
      <p>
        Sempre que o usuário precisar enviar um ou mais arquivos: currículo,
        comprovante de residência, imagem de perfil, documento escaneado. O
        componente valida tipo e tamanho antes do envio, evitando idas e voltas
        ao servidor.
      </p>

      <h3>Quando não usar</h3>
      <p>
        Para upload de imagem apenas para visualização (crop, avatar), use um
        componente dedicado de upload de imagem. Para upload de vários arquivos
        com progresso individual e fila, considere um componente mais
        especializado.
      </p>

      <h3>Acessibilidade</h3>
      <ul>
        <li>
          O input nativo está acessível via <code>sr-only</code> e pode ser
          acionado por Enter ou Espaço quando o invólucro recebe foco.
        </li>
        <li>
          A mensagem de erro usa <code>role=&quot;alert&quot;</code> para ser
          anunciada imediatamente pelo leitor de tela.
        </li>
        <li>
          O estado de arraste é sinalizado visualmente (borda e fundo mudam),
          mas a ação de clique sempre está disponível como alternativa.
        </li>
        <li>
          Cada arquivo na lista exibe nome e tamanho em texto, sem depender de
          ícones para transmitir a informação.
        </li>
      </ul>

      <h3>Uso</h3>
      <pre>
        <code>{`import { FileUpload } from "semec-ds/react";

<FileUpload
  accept=".pdf,image/*"
  maxSize={5 * 1024 * 1024}
  hint="PDF ou imagem, até 5 MB"
/>`}</code>
      </pre>
      <p>
        <code>accept</code> limita os tipos de arquivo no seletor.{" "}
        <code>maxSize</code> define o limite em bytes.{" "}
        <code>hint</code> aparece abaixo da área de arraste como orientação.
      </p>

      <h3>Props</h3>
      <table>
        <thead>
          <tr>
            <th>Prop</th>
            <th>Tipo</th>
            <th>Padrão</th>
            <th>Descrição</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>accept</code></td>
            <td><code>string</code></td>
            <td>—</td>
            <td>Tipos de arquivo aceitos pelo input (ex.: &quot;.pdf,image/*&quot;).</td>
          </tr>
          <tr>
            <td><code>maxSize</code></td>
            <td><code>number</code></td>
            <td>—</td>
            <td>Tamanho máximo em bytes. Excede → erro.</td>
          </tr>
          <tr>
            <td><code>label</code></td>
            <td><code>string</code></td>
            <td>—</td>
            <td>Rótulo acima da área de arraste.</td>
          </tr>
          <tr>
            <td><code>hint</code></td>
            <td><code>string</code></td>
            <td>—</td>
            <td>Texto auxiliar abaixo da área de arraste.</td>
          </tr>
          <tr>
            <td><code>error</code></td>
            <td><code>string</code></td>
            <td>—</td>
            <td>Mensagem de erro controlada externamente.</td>
          </tr>
          <tr>
            <td><code>onChange</code></td>
            <td><code>(files: File[]) =&gt; void</code></td>
            <td>—</td>
            <td>Callback chamado quando os arquivos mudam.</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
