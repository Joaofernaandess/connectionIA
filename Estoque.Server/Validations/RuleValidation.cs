using System.Text.RegularExpressions;

namespace Estoque.Server.Validations;

public class RuleValidation
{
    public static bool CnpjValido(string cnpj)
    {
        if (string.IsNullOrWhiteSpace(cnpj)) return true;

        cnpj = Regex.Replace(cnpj, "[^0-9]", "");

        if (cnpj.Length != 14) return false;

        if (new string(cnpj[0], 14) == cnpj) return false;

        int[] multiplicador1 = new int[12] { 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };
        int[] multiplicador2 = new int[13] { 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2 };

        string tempCnpj = cnpj.Substring(0, 12);
        int soma = 0;

        for (int i = 0; i < 12; i++)
            soma += int.Parse(tempCnpj[i].ToString()) * multiplicador1[i];

        int resto = soma % 11;
        int digito1 = resto < 2 ? 0 : 11 - resto;
        tempCnpj += digito1.ToString();

        soma = 0;
        for (int i = 0; i < 13; i++)
            soma += int.Parse(tempCnpj[i].ToString()) * multiplicador2[i];

        resto = soma % 11;
        int digito2 = resto < 2 ? 0 : 11 - resto;

        string digitos = $"{digito1}{digito2}";

        return cnpj.EndsWith(digitos);
    }
}