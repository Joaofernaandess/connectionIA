using Npgsql;
using NpgsqlTypes;
using Pedido.Domain.Interfaces;
using Pedido.Domain.Services;
using Pedido.Infra.Services;
using Serilog;
using Serilog.Events;
using Serilog.Sinks.PostgreSQL;

namespace Pedido.Server.Startup;

public static class AuditoriaConfiguration
{
    public static async Task AddAuditoriaConfiguration(
        this WebApplicationBuilder builder,
        string connectionString)
    {
        await CriarEstruturaAuditoria(connectionString);

        builder.Host.UseSerilog((_, loggerConfiguration) =>
        {
            loggerConfiguration
                .MinimumLevel.Information()
                .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
                .Enrich.FromLogContext()
                .WriteTo.Console()
                .WriteTo.Logger(logger => logger
                    .Filter.ByIncludingOnly(logEvent =>
                        logEvent.Properties.TryGetValue("LogTipo", out var logTipo)
                        && logTipo.ToString().Trim('"') == "Auditoria")
                    .WriteTo.PostgreSQL(
                        connectionString,
                        tableName: "eventos",
                        columnOptions: CriarColunasAuditoria(),
                        restrictedToMinimumLevel: LogEventLevel.Information,
                        schemaName: "auditoria",
                        needAutoCreateTable: true));
        });

        builder.Services.AddSingleton<IAuditoriaQueue, AuditoriaQueue>();
        builder.Services.AddScoped<IAuditoriaService, AuditoriaService>();
        builder.Services.AddScoped<AuditoriaHistoricoService>();
        builder.Services.AddHostedService<AuditoriaBackgroundService>();
    }

    private static Dictionary<string, ColumnWriterBase> CriarColunasAuditoria()
    {
        return new Dictionary<string, ColumnWriterBase>
        {
            ["timestamp"] = new TimestampColumnWriter(NpgsqlDbType.Timestamp),
            ["level"] = new LevelColumnWriter(true, NpgsqlDbType.Varchar, 64),
            ["message"] = new RenderedMessageColumnWriter(NpgsqlDbType.Text),
            ["message_template"] = new MessageTemplateColumnWriter(NpgsqlDbType.Text),
            ["exception"] = new ExceptionColumnWriter(NpgsqlDbType.Text),
            ["properties"] = new PropertiesColumnWriter(NpgsqlDbType.Jsonb),
            ["log_event"] = new LogEventSerializedColumnWriter(NpgsqlDbType.Jsonb)
        };
    }

    private static async Task CriarEstruturaAuditoria(string connectionString)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            """
            CREATE SCHEMA IF NOT EXISTS auditoria;

            CREATE TABLE IF NOT EXISTS auditoria.eventos (
                timestamp timestamp without time zone NULL,
                level varchar(64) NULL,
                message text NULL,
                message_template text NULL,
                exception text NULL,
                properties jsonb NULL,
                log_event jsonb NULL
            );
            """,
            connection);

        await command.ExecuteNonQueryAsync();
    }
}